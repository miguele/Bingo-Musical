import { database } from './firebaseConfig';
import { ref, get, set, remove } from 'firebase/database';
import { StoredGame } from './types';

const GAMES_REF = 'games';

/**
 * Gets a specific game from Firebase Realtime Database.
 * @param gameCode The code of the game to fetch.
 * @returns A promise that resolves with the game data or null if not found.
 */
export const getGame = async (gameCode: string): Promise<StoredGame | null> => {
    try {
        const gameRef = ref(database, `${GAMES_REF}/${gameCode}`);
        const snapshot = await get(gameRef);
        if (snapshot.exists()) {
            return snapshot.val() as StoredGame;
        }
        return null;
    } catch (error) {
        console.error("Firebase getGame error:", error);
        throw new Error("No se pudo conectar con el servidor de partidas.");
    }
};

/**
 * Saves a specific game's state to Firebase Realtime Database.
 * @param gameCode The code of the game to save.
 * @param gameData The full game data object.
 */
export const saveGame = async (gameCode: string, gameData: StoredGame): Promise<void> => {
    try {
        const gameRef = ref(database, `${GAMES_REF}/${gameCode}`);
        await set(gameRef, gameData);
    } catch (error) {
        console.error("Firebase saveGame error:", error);
        throw new Error("No se pudo guardar el estado de la partida.");
    }
};


/**
 * Deletes a specific game from Firebase Realtime Database.
 * @param gameCode The code of the game to delete.
 */
export const deleteGame = async (gameCode: string): Promise<void> => {
    try {
        const gameRef = ref(database, `${GAMES_REF}/${gameCode}`);
        await remove(gameRef);
    } catch (error) {
        console.error("Firebase deleteGame error:", error);
        throw new Error("No se pudo borrar la partida del servidor.");
    }
};
