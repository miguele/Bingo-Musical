import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, GameContextType, User, Player, BingoCard, GameStatus, GameScreen, BingoCell, ToastMessage } from '../types';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../spotifyConfig';

// --- LocalStorage Persistence ---

const BINGO_GAMES_STORAGE_KEY = 'bingoGames';
const SPOTIFY_TOKEN_STORAGE_KEY = 'spotifyAuthToken';
const SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY = 'spotifyAuthTokenExpiry';

type StoredGame = {
    playlist: string[];
    players: Player[];
    gameStatus: GameStatus;
};

type StoredGames = {
    [gameCode: string]: StoredGame;
};

const getStoredGames = (): StoredGames => {
    try {
        const games = localStorage.getItem(BINGO_GAMES_STORAGE_KEY);
        return games ? JSON.parse(games) : {};
    } catch (error) {
        console.error("Error reading games from localStorage", error);
        return {};
    }
};

const saveStoredGames = (games: StoredGames) => {
    try {
        localStorage.setItem(BINGO_GAMES_STORAGE_KEY, JSON.stringify(games));
    } catch (error) {
        console.error("Error saving games to localStorage", error);
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

    // Automatic Spotify connection using Client Credentials Flow
    useEffect(() => {
        const connectToSpotify = async () => {
            // Check for existing valid token first
            const persistedToken = localStorage.getItem(SPOTIFY_TOKEN_STORAGE_KEY);
            const persistedExpiry = localStorage.getItem(SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY);
            if (persistedToken && persistedExpiry && Date.now() < parseInt(persistedExpiry, 10)) {
                setState(s => ({ 
                    ...s, 
                    spotifyAccessToken: persistedToken, 
                    spotifyTokenExpiresAt: parseInt(persistedExpiry, 10),
                    isConnectingToSpotify: false 
                }));
                return;
            }

            setState(s => ({ ...s, isConnectingToSpotify: true, spotifyConnectionError: null }));

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
                 showToast('Conectado a Spotify automáticamente.', 'success');

            } catch (error: any) {
                console.error("Spotify Client Credentials Error:", error);
                const errorMessage = error.message || 'Error de conexión automática con Spotify.';
                setState(s => ({
                    ...s,
                    isConnectingToSpotify: false,
                    spotifyConnectionError: errorMessage
                }));
                showToast(errorMessage, 'error');
            }
        };

        connectToSpotify();
    }, [showToast]);

    // DJ dashboard polling to get live player progress
    useEffect(() => {
        if (state.user?.role === 'DJ' && state.currentScreen === GameScreen.DJ_DASHBOARD && state.gameCode) {
            const intervalId = setInterval(() => {
                const games = getStoredGames();
                const gameData = games[state.gameCode!];
                if (gameData) {
                    // Sync player list if it has changed
                    if (JSON.stringify(gameData.players) !== JSON.stringify(state.players)) {
                        setState(s => ({ ...s, players: gameData.players }));
                    }
                    // Check if a player has won
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

    const removeToast = useCallback((id: number) => {
        setState(s => ({ ...s, toasts: s.toasts.filter(toast => toast.id !== id) }));
    }, []);
    
    const logoutFromSpotify = useCallback(() => {
        localStorage.removeItem(SPOTIFY_TOKEN_STORAGE_KEY);
        localStorage.removeItem(SPOTIFY_TOKEN_EXPIRY_STORAGE_KEY);
        setState(s => ({ 
            ...s, 
            spotifyAccessToken: null, 
            spotifyTokenExpiresAt: null,
            // Trigger reconnection on next attempt
            isConnectingToSpotify: true, 
            spotifyConnectionError: null 
        }));
        showToast('Se ha cerrado la sesión de Spotify. Recarga para reconectar.', 'info');
    }, [showToast]);

    const login = useCallback((name: string, role: 'DJ' | 'Player') => {
        setState(s => ({ ...s, user: { name, role }, currentScreen: GameScreen.HOME }));
    }, []);

    const logout = useCallback(() => {
        if (state.user?.role === 'DJ' && state.gameCode) {
            const games = getStoredGames();
            delete games[state.gameCode];
            saveStoredGames(games);
        }
        setState(s => ({ 
            ...initialState, 
            spotifyAccessToken: s.spotifyAccessToken,
            spotifyTokenExpiresAt: s.spotifyTokenExpiresAt,
            isConnectingToSpotify: s.isConnectingToSpotify,
            spotifyConnectionError: s.spotifyConnectionError,
        }));
    }, [state.user, state.gameCode]);

    const resetGame = useCallback(() => {
        if (state.gameCode) {
            const games = getStoredGames();
            delete games[state.gameCode];
            saveStoredGames(games);
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

    const createGame = useCallback((songs: string[]) => {
        const games = getStoredGames();
        let gameCode;
        do {
            gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (games[gameCode]);

        games[gameCode] = {
            playlist: songs,
            players: [],
            gameStatus: GameStatus.IN_PROGRESS
        };
        saveStoredGames(games);

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

    const joinGame = useCallback((code: string): boolean => {
        const games = getStoredGames();
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
            saveStoredGames(games);

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
        return false;
    }, [state.user, showToast]);

    const markCell = useCallback((rowIndex: number, colIndex: number) => {
        if (!state.user || !state.gameCode) return;

        setState(s => {
            if (!s.gameCode) return s;

            const playerIndex = s.players.findIndex(p => p.name === s.user?.name);
            if (playerIndex === -1) return s;

            const newPlayers = JSON.parse(JSON.stringify(s.players));
            const player = newPlayers[playerIndex];
            
            if (player.card[rowIndex][colIndex].marked) {
                return s; 
            }
            
            player.card[rowIndex][colIndex].marked = true;

            let markedCount = 0;
            player.card.forEach((row: BingoCell[]) => row.forEach((cell: BingoCell) => {
                if (cell.marked) markedCount++;
            }));
            player.markedCount = markedCount;
            
            const games = getStoredGames();
            const gameData = games[s.gameCode];
            let isWinner = false;

            if (gameData) {
                const storedPlayerIndex = gameData.players.findIndex(p => p.name === s.user?.name);
                if (storedPlayerIndex !== -1) {
                    gameData.players[storedPlayerIndex] = player;
                }
                
                if (markedCount === 25) {
                    isWinner = true;
                    gameData.gameStatus = GameStatus.FINISHED;
                    showToast('¡BINGO! Has ganado la partida.', 'success');
                }
                saveStoredGames(games);
            }

            if (isWinner) {
                return { ...s, players: newPlayers, winner: player, gameStatus: GameStatus.FINISHED };
            }

            return { ...s, players: newPlayers };
        });
    }, [showToast]);


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
        logoutFromSpotify,
    }), [state, login, logout, setCurrentScreen, createGame, joinGame, markCell, resetGame, showToast, removeToast, logoutFromSpotify]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};