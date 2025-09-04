import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, GameContextType, User, Player, BingoCard, GameStatus, GameScreen, BingoCell, ToastMessage } from '../types';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../spotifyConfig';
import { getRemoteGames, saveRemoteGames } from '../gameStorage';


// --- LocalStorage Persistence for Spotify Token Only ---
const SPOTIFY_TOKEN_STORAGE_KEY = 'spotifyAuthToken';
const SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY = 'spotifyAuthTokenExpiry';

// --- Spotify API Helper ---
const extractPlaylistId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'open.spotify.com') return null;
        const pathMatch = urlObj.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
        return pathMatch ? pathMatch[1] : null;
    } catch {
        return null;
    }
};


// --- Game Logic ---

export const GameContext = createContext<GameContextType | undefined>(undefined);

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const generateBingoCard = (playlist: string[]): BingoCard => {
    const shuffledSongs = shuffleArray(playlist).slice(0, 24);
    const card: BingoCard = Array(5).fill(null).map(() => Array(5).fill(null));
    let songIndex = 0;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (i === 2 && j === 2) {
                card[i][j] = { song: "GRATIS", marked: true };
            } else {
                card[i][j] = { song: shuffledSongs[songIndex++], marked: false };
            }
        }
    }
    return card;
};

const initialState: GameState = {
    user: null,
    currentScreen: GameScreen.LOGIN,
    gameCode: null,
    playlist: [],
    players: [],
    gameStatus: GameStatus.LOBBY,
    winner: null,
    toasts: [],
    spotifyAccessToken: null,
    spotifyTokenExpiresAt: null,
    isConnectingToSpotify: true,
    spotifyConnectionError: null,
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(initialState);
    
    const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
        const newToast: ToastMessage = { id: Date.now(), message, type };
        setState(s => ({ ...s, toasts: [...s.toasts, newToast] }));
    }, []);

    // --- Effects ---

    const refreshSpotifyToken = useCallback(async () => {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error_description || 'Fallo al autenticar con Spotify.');
            }

            const data = await response.json();
            const expiresAt = Date.now() + data.expires_in * 1000;
            
            localStorage.setItem(SPOTIFY_TOKEN_STORAGE_KEY, data.access_token);
            localStorage.setItem(SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY, expiresAt.toString());

            setState(s => ({
                ...s,
                spotifyAccessToken: data.access_token,
                spotifyTokenExpiresAt: expiresAt,
                isConnectingToSpotify: false,
            }));
            return data.access_token;
        } catch (error: any) {
            console.error("Spotify Client Credentials Error:", error);
            const errorMessage = error.message || 'Error de conexión automática con Spotify.';
            setState(s => ({
                ...s,
                isConnectingToSpotify: false,
                spotifyConnectionError: errorMessage
            }));
            showToast(errorMessage, 'error');
            return null;
        }
    }, [showToast]);

    useEffect(() => {
        const initialConnect = async () => {
            const persistedToken = localStorage.getItem(SPOTIFY_TOKEN_STORAGE_KEY);
            const persistedExpiry = localStorage.getItem(SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY);
            
            if (persistedToken && persistedExpiry && Date.now() < parseInt(persistedExpiry, 10)) {
                setState(s => ({ 
                    ...s, 
                    spotifyAccessToken: persistedToken, 
                    spotifyTokenExpiresAt: parseInt(persistedExpiry, 10),
                    isConnectingToSpotify: false 
                }));
            } else {
                 setState(s => ({ ...s, isConnectingToSpotify: true, spotifyConnectionError: null }));
                const token = await refreshSpotifyToken();
                if (token) {
                    showToast('Conectado a Spotify automáticamente.', 'success');
                }
            }
        };
        initialConnect();
    }, [refreshSpotifyToken, showToast]);

    // DJ dashboard polling to get live player progress
    useEffect(() => {
        if (state.user?.role === 'DJ' && state.currentScreen === GameScreen.DJ_DASHBOARD && state.gameCode) {
            const intervalId = setInterval(async () => {
                const games = await getRemoteGames();
                const gameData = games[state.gameCode!];
                if (gameData) {
                    if (JSON.stringify(gameData.players) !== JSON.stringify(state.players)) {
                        setState(s => ({ ...s, players: gameData.players }));
                    }
                    if (gameData.gameStatus === GameStatus.FINISHED && state.gameStatus !== GameStatus.FINISHED) {
                        const winner = gameData.players.find(p => p.markedCount === 25);
                        if(winner) {
                           setState(s => ({ ...s, winner, gameStatus: GameStatus.FINISHED, players: gameData.players }));
                        }
                    }
                }
            }, 2000);

            return () => clearInterval(intervalId);
        }
    }, [state.user?.role, state.currentScreen, state.gameCode, state.players, state.gameStatus]);

    // --- Context Methods ---
    
    const fetchSpotifyPlaylist = useCallback(async (playlistUrl: string): Promise<string[]> => {
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            throw new Error('La URL no parece ser una playlist de Spotify válida.');
        }

        const fetchAllTracks = async (token: string): Promise<any[]> => {
            let tracks: any[] = [];
            let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(name,artists(name))),next`;

            while (nextUrl) {
                const response = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) {
                    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
                    if (response.status === 404) throw new Error('Playlist no encontrada. Asegúrate de que el enlace es correcto y la playlist es pública.');
                    throw new Error('No se pudo obtener la información de la playlist.');
                }
                const data = await response.json();
                tracks = tracks.concat(data.items.filter((item: any) => item.track)); 
                nextUrl = data.next;
            }
            return tracks;
        };

        const formatTracks = (tracks: any[]): string[] => {
            return tracks.map(item => 
                `${item.track.name} - ${item.track.artists.map((a: any) => a.name).join(', ')}`
            );
        };

        try {
            if (!state.spotifyAccessToken) throw new Error("Aún conectando con Spotify. Inténtalo de nuevo en un momento.");
            const tracks = await fetchAllTracks(state.spotifyAccessToken);
            return formatTracks(tracks);
        } catch (error: any) {
            if (error.message === 'TOKEN_EXPIRED') {
                showToast('El token de Spotify ha caducado. Refrescando automáticamente...', 'info');
                const newToken = await refreshSpotifyToken();
                if (newToken) {
                    const tracks = await fetchAllTracks(newToken);
                    return formatTracks(tracks);
                } else {
                    throw new Error("Fallo al refrescar el token de Spotify. Recarga la página.");
                }
            }
            throw error; // Re-throw other errors
        }
    }, [state.spotifyAccessToken, refreshSpotifyToken, showToast]);

    const removeToast = useCallback((id: number) => {
        setState(s => ({ ...s, toasts: s.toasts.filter(toast => toast.id !== id) }));
    }, []);
    
    const login = useCallback((name: string, role: 'DJ' | 'Player') => {
        setState(s => ({ ...s, user: { name, role }, currentScreen: GameScreen.HOME }));
    }, []);

    const logout = useCallback(async () => {
        if (state.user?.role === 'DJ' && state.gameCode) {
            const games = await getRemoteGames();
            delete games[state.gameCode];
            await saveRemoteGames(games);
        }
        setState(s => ({ 
            ...initialState, 
            spotifyAccessToken: s.spotifyAccessToken,
            spotifyTokenExpiresAt: s.spotifyTokenExpiresAt,
            isConnectingToSpotify: s.isConnectingToSpotify,
            spotifyConnectionError: s.spotifyConnectionError,
        }));
    }, [state.user, state.gameCode]);

    const resetGame = useCallback(async () => {
        if (state.gameCode) {
            const games = await getRemoteGames();
            delete games[state.gameCode];
            await saveRemoteGames(games);
        }
        
        setState(s => ({
            ...initialState,
            user: s.user,
            currentScreen: s.user ? GameScreen.HOME : GameScreen.LOGIN,
            spotifyAccessToken: s.spotifyAccessToken,
            spotifyTokenExpiresAt: s.spotifyTokenExpiresAt,
            isConnectingToSpotify: s.isConnectingToSpotify,
            spotifyConnectionError: s.spotifyConnectionError,
        }));
    }, [state.gameCode]);

    const setCurrentScreen = useCallback((screen: GameScreen) => {
        setState(s => ({ ...s, currentScreen: screen }));
    }, []);

    const createGame = useCallback(async (songs: string[]) => {
        const games = await getRemoteGames();
        let gameCode;
        do {
            gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (games[gameCode]);

        games[gameCode] = {
            playlist: songs,
            players: [],
            gameStatus: GameStatus.IN_PROGRESS
        };
        await saveRemoteGames(games);

        setState(s => ({
            ...s,
            gameCode,
            playlist: songs,
            gameStatus: GameStatus.IN_PROGRESS,
            currentScreen: GameScreen.DJ_DASHBOARD,
            players: []
        }));
        showToast(`Partida creada con el código: ${gameCode}`, 'success');
    }, [showToast]);

    const joinGame = useCallback(async (code: string): Promise<boolean> => {
        const games = await getRemoteGames();
        const gameCode = code.toUpperCase();
        const gameData = games[gameCode];

        if (gameData && state.user) {
            if (gameData.gameStatus === GameStatus.FINISHED) {
                showToast('Esta partida ya ha terminado.', 'error');
                return false;
            }

            const playerExists = gameData.players.some(p => p.name === state.user?.name);
            
            if (playerExists) {
                setState(s => ({
                    ...s,
                    gameCode,
                    playlist: gameData.playlist,
                    players: gameData.players,
                    gameStatus: gameData.gameStatus,
                    currentScreen: GameScreen.GAME_BOARD,
                }));
                showToast(`Bienvenido de vuelta, ${state.user.name}.`, 'info');
                return true;
            }

            const card = generateBingoCard(gameData.playlist);
            const newPlayer: Player = {
                name: state.user.name,
                card: card,
                markedCount: 1 
            };
            
            gameData.players.push(newPlayer);
            await saveRemoteGames(games);

            setState(s => ({
                ...s,
                gameCode,
                playlist: gameData.playlist,
                players: gameData.players,
                gameStatus: gameData.gameStatus,
                currentScreen: GameScreen.GAME_BOARD
            }));
            showToast(`${newPlayer.name} se ha unido a la partida.`, 'info');
            return true;
        }
        showToast('Código de partida no encontrado.', 'error');
        return false;
    }, [state.user, showToast]);

    const markCell = useCallback(async (rowIndex: number, colIndex: number) => {
        if (!state.user || !state.gameCode) return;
        
        const player = state.players.find(p => p.name === state.user?.name);
        if (!player || player.card[rowIndex][colIndex].marked) return;

        // 1. Optimistic UI Update
        const playerIndex = state.players.findIndex(p => p.name === state.user?.name);
        const newPlayers = JSON.parse(JSON.stringify(state.players));
        const updatedPlayer = newPlayers[playerIndex];

        updatedPlayer.card[rowIndex][colIndex].marked = true;
        let markedCount = 0;
        updatedPlayer.card.forEach((row: BingoCell[]) => row.forEach((cell: BingoCell) => {
            if (cell.marked) markedCount++;
        }));
        updatedPlayer.markedCount = markedCount;

        setState(s => ({ ...s, players: newPlayers }));

        // 2. Save state to remote
        try {
            const games = await getRemoteGames();
            const gameData = games[state.gameCode];
            if (!gameData) throw new Error("La partida ya no existe en el servidor.");

            const storedPlayerIndex = gameData.players.findIndex(p => p.name === state.user?.name);
            if (storedPlayerIndex === -1) throw new Error("No se encontró tu jugador en la partida.");

            gameData.players[storedPlayerIndex] = updatedPlayer;
            
            const isWinner = markedCount === 25;
            if (isWinner) {
                gameData.gameStatus = GameStatus.FINISHED;
            }

            await saveRemoteGames(games);

            if (isWinner) {
                showToast('¡BINGO! Has ganado la partida.', 'success');
                setState(s => ({ ...s, winner: updatedPlayer, gameStatus: GameStatus.FINISHED }));
            }

        } catch (error: any) {
            console.error("Failed to save mark:", error);
            showToast("Error al guardar tu jugada. Se deshará el cambio.", 'error');
            
            // Revert the optimistic UI update on failure
            setState(s => ({ ...s, players: s.players }));
        }
    }, [showToast, state.gameCode, state.players, state.user]);


    const contextValue = useMemo(() => ({
        ...state,
        login,
        logout,
        setCurrentScreen,
        createGame,
        joinGame,
        markCell,
        resetGame,
        showToast,
        removeToast,
        fetchSpotifyPlaylist,
    }), [state, login, logout, setCurrentScreen, createGame, joinGame, markCell, resetGame, showToast, removeToast, fetchSpotifyPlaylist]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};