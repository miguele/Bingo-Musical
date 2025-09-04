import { StoredGames } from './types';

// Usamos un servicio gratuito de almacenamiento JSON. 
// La URL es única para esta aplicación para evitar colisiones.
const STORAGE_URL = 'https://jsonbase.com/bingo-boda-sara-fran/games';

/**
 * Obtiene el objeto de todas las partidas desde el almacenamiento remoto.
 * @returns Una promesa que se resuelve con el objeto de partidas.
 */
export const getRemoteGames = async (): Promise<StoredGames> => {
    try {
        const response = await fetch(STORAGE_URL);
        if (!response.ok) {
            // Un 404 es normal si no se ha guardado ninguna partida todavía.
            if (response.status === 404) {
                return {};
            }
            throw new Error(`Error al cargar las partidas: ${response.statusText}`);
        }
        const data = await response.json();
        // El servicio puede devolver null o una cadena vacía si el bucket está vacío.
        return data || {};
    } catch (error) {
        console.error("Fallo al obtener las partidas remotas:", error);
        // Devolvemos un objeto vacío en caso de error para no romper la aplicación.
        return {};
    }
};

/**
 * Guarda el objeto completo de partidas en el almacenamiento remoto.
 * @param games El objeto de partidas a guardar.
 */
export const saveRemoteGames = async (games: StoredGames): Promise<void> => {
    try {
        const response = await fetch(STORAGE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(games)
        });
        if (!response.ok) {
            throw new Error(`Error al guardar la partida: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Fallo al guardar las partidas remotas:", error);
        // Relanzamos el error para que la UI pueda notificar al usuario.
        throw new Error("No se pudo guardar el estado de la partida.");
    }
};
