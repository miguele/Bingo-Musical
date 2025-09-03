
import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, GameContextType, User, Player, BingoCard, GameStatus, GameScreen, BingoCell } from '../types';

export const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock playlist for demonstration purposes
const MOCK_SONGS = [
    "Bailando - Enrique Iglesias", "La Bicicleta - Shakira", "Despacito - Luis Fonsi",
    "Vivir Mi Vida - Marc Anthony", "Gasolina - Daddy Yankee", "Macarena - Los Del Rio",
    "Corazón Partío - Alejandro Sanz", "La Camisa Negra - Juanes", "Waka Waka - Shakira",
    "Danza Kuduro - Don Omar", "Ai Se Eu Te Pego - Michel Teló", "Obsesión - Aventura",
    "Bamboleo - Gipsy Kings", "Color Esperanza - Diego Torres", "Clavado en un Bar - Maná",
    "El Sol no Regresa - La Quinta Estación", "Andas en Mi Cabeza - Chino & Nacho", "La Gozadera - Gente De Zona",
    "Duele el Corazón - Enrique Iglesias", "Échame La Culpa - Luis Fonsi, Demi Lovato", "Felices los 4 - Maluma",
    "Mi Gente - J Balvin", "Mayores - Becky G", "Calma - Pedro Capó", "Tusa - Karol G", "Pepas - Farruko",
    "Yo Perreo Sola - Bad Bunny", "Hawái - Maluma", "Todo de Ti - Rauw Alejandro", "Despechá - Rosalía",
    "As It Was - Harry Styles", "Blinding Lights - The Weeknd", "Flowers - Miley Cyrus", "Stay - The Kid LAROI",
    "Levitating - Dua Lipa", "Watermelon Sugar - Harry Styles", "I Wanna Dance with Somebody - Whitney Houston",
    "Don't Stop Believin' - Journey", "Bohemian Rhapsody - Queen", "Uptown Funk - Mark Ronson"
];


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
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(initialState);

    const login = useCallback((name: string, role: 'DJ' | 'Player') => {
        setState(s => ({ ...s, user: { name, role }, currentScreen: GameScreen.HOME }));
    }, []);

    const logout = useCallback(() => {
        setState(initialState);
    }, []);

    const resetGame = useCallback(() => {
        setState(s => ({
            ...initialState,
            user: s.user // Keep the user logged in
        }));
        if(state.user) {
           setCurrentScreen(GameScreen.HOME);
        }
    }, [state.user]);


    const setCurrentScreen = useCallback((screen: GameScreen) => {
        setState(s => ({ ...s, currentScreen: screen }));
    }, []);

    const createGame = useCallback((playlistUrl: string) => {
        console.log("Creando juego con la playlist:", playlistUrl); // Simulate using the URL
        const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setState(s => ({
            ...s,
            gameCode,
            playlist: MOCK_SONGS,
            gameStatus: GameStatus.IN_PROGRESS,
            currentScreen: GameScreen.DJ_DASHBOARD,
            players: []
        }));
    }, []);

    const joinGame = useCallback((code: string): boolean => {
        if (state.gameCode && code.toUpperCase() === state.gameCode) {
            if (state.user) {
                const card = generateBingoCard(state.playlist);
                const newPlayer: Player = {
                    name: state.user.name,
                    card: card,
                    markedCount: 1 // Free space
                };

                // Avoid adding the same player twice
                if(state.players.some(p => p.name === newPlayer.name)) {
                     setState(s => ({ ...s, currentScreen: GameScreen.GAME_BOARD }));
                     return true;
                }

                setState(s => ({
                    ...s,
                    players: [...s.players, newPlayer],
                    currentScreen: GameScreen.GAME_BOARD
                }));
                return true;
            }
        }
        return false;
    }, [state.gameCode, state.user, state.playlist, state.players]);

    const markCell = useCallback((rowIndex: number, colIndex: number) => {
        if (!state.user) return;

        setState(s => {
            const playerIndex = s.players.findIndex(p => p.name === s.user?.name);
            if (playerIndex === -1) return s;

            const newPlayers = [...s.players];
            const player = { ...newPlayers[playerIndex] };
            
            const newCard = player.card.map(row => row.map(cell => ({...cell})));
            
            if (!newCard[rowIndex][colIndex].marked) {
                newCard[rowIndex][colIndex].marked = true;

                let markedCount = 0;
                for (const row of newCard) {
                    for (const cell of row) {
                        if (cell.marked) markedCount++;
                    }
                }

                player.card = newCard;
                player.markedCount = markedCount;
                newPlayers[playerIndex] = player;
                
                // Check for winner
                if(markedCount === 25) {
                    return {...s, players: newPlayers, winner: player, gameStatus: GameStatus.FINISHED };
                }

                return { ...s, players: newPlayers };
            }

            return s; // No change
        });
    }, [state.user]);


    const contextValue = useMemo(() => ({
        ...state,
        login,
        logout,
        setCurrentScreen,
        createGame,
        joinGame,
        markCell,
        resetGame
    }), [state, login, logout, setCurrentScreen, createGame, joinGame, markCell, resetGame]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};
