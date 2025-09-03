
export interface User {
    name: string;
    role: 'DJ' | 'Player';
}

export interface BingoCell {
    song: string;
    marked: boolean;
}

export type BingoCard = BingoCell[][];

export interface Player {
    name: string;
    card: BingoCard;
    markedCount: number;
}

export enum GameStatus {
    LOBBY = 'LOBBY',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED'
}

export enum GameScreen {
    LOGIN = 'LOGIN',
    HOME = 'HOME',
    CREATE_GAME = 'CREATE_GAME',
    JOIN_GAME = 'JOIN_GAME',
    GAME_BOARD = 'GAME_BOARD',
    DJ_DASHBOARD = 'DJ_DASHBOARD'
}

export interface GameState {
    user: User | null;
    currentScreen: GameScreen;
    gameCode: string | null;
    playlist: string[];
    players: Player[];
    gameStatus: GameStatus;
    winner: Player | null;
}

export interface GameContextType extends GameState {
    login: (name: string, role: 'DJ' | 'Player') => void;
    logout: () => void;
    setCurrentScreen: (screen: GameScreen) => void;
    createGame: (playlistUrl: string) => void;
    joinGame: (code: string) => boolean;
    markCell: (rowIndex: number, colIndex: number) => void;
    resetGame: () => void;
}
