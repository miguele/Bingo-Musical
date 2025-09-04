import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { GameScreen } from '../../types';
import MusicNoteIcon from '../icons/MusicNoteIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import { SPOTIFY_ACCESS_TOKEN } from '../../config';

// --- Spotify API Helper Functions ---
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

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

const fetchAllTracks = async (playlistId: string, token: string): Promise<any[]> => {
    let tracks: any[] = [];
    let nextUrl: string | null = `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks?fields=items(track(name,artists(name))),next`;

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
             if (response.status === 401) {
                throw new Error('El token de Spotify no es válido o ha expirado. Por favor, genera uno nuevo y actualiza el fichero config.ts.');
            }
            if (response.status === 404) {
                throw new Error('Playlist no encontrada. Asegúrate de que el enlace es correcto y la playlist es pública o colaborativa.');
            }
            throw new Error('No se pudo obtener la información de la playlist.');
        }

        const data = await response.json();
        tracks = tracks.concat(data.items.filter((item: any) => item.track)); 
        nextUrl = data.next;
    }
    return tracks;
};


// --- Components ---

const SpotifySetupGuide: React.FC = () => (
    <div className="flex justify-center items-center pt-8 md:pt-16">
        <Card className="w-full max-w-2xl">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Configuración Requerida</h2>
                <p className="text-gray-600 mb-6">Para conectar con Spotify, primero necesitas configurar tu token de acceso.</p>
            </div>
            <div className="space-y-4 text-left bg-blue-50/50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-gray-700">Sigue estos pasos:</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-600">
                    <li>
                        Ve a la consola de Spotify para desarrolladores y obtén un token.
                        <a href="https://developer.spotify.com/console/get-playlist-tracks/" target="_blank" rel="noopener noreferrer" className="ml-2 inline-block bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors">
                            Obtener Token &rarr;
                        </a>
                    </li>
                    <li>En esa página, haz clic en el botón verde <strong>"GET TOKEN"</strong>. Acepta los permisos que te pida.</li>
                    <li>Copia el token de acceso (largo) que aparece.</li>
                    <li>
                        Abre el fichero <code className="bg-gray-200 text-sm p-1 rounded-md">config.ts</code> en tu editor de código.
                    </li>
                    <li>
                        Pega tu token para reemplazar el texto de ejemplo:
                        <code className="block bg-gray-200 text-sm p-3 rounded-md mt-2 overflow-x-auto">
                           export const SPOTIFY_ACCESS_TOKEN = 'AQUÍ_VA_TU_TOKEN';
                        </code>
                    </li>
                </ol>
                <p className="text-sm text-gray-500 pt-2">Una vez guardes el cambio, esta pantalla se actualizará automáticamente.</p>
            </div>
        </Card>
    </div>
);


const CreateGameScreen: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadedSongs, setLoadedSongs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const { createGame, setCurrentScreen } = useGame();
    
    // Check if the token is provided in the config file.
    const isConfigured = SPOTIFY_ACCESS_TOKEN && !SPOTIFY_ACCESS_TOKEN.includes('TU_TOKEN_DE_SPOTIFY_VA_AQUI');

    const handleLoadPlaylist = async () => {
        setError('');
        setLoadedSongs([]);
        
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            setError('La URL no parece ser una playlist de Spotify válida.');
            return;
        }

        setIsLoading(true);

        try {
            const tracks = await fetchAllTracks(playlistId, SPOTIFY_ACCESS_TOKEN);
            const formattedSongs = tracks.map(item => 
                `${item.track.name} - ${item.track.artists.map((a: any) => a.name).join(', ')}`
            );
            
            if (formattedSongs.length < 24) {
                 setError(`Se necesitan al menos 24 canciones para generar los cartones. Esta playlist solo tiene ${formattedSongs.length}.`);
                 setLoadedSongs([]);
            } else {
                setLoadedSongs(formattedSongs);
            }

        } catch (e: any) {
             setError(e.message || 'Ocurrió un error desconocido al cargar la playlist.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (loadedSongs.length > 0) {
            createGame(loadedSongs);
        }
    };

    if (!isConfigured) {
        return <SpotifySetupGuide />;
    }

    return (
        <div className="flex justify-center items-center pt-8 md:pt-16">
            <Card className="w-full max-w-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Crear Nueva Partida</h2>
                    <p className="text-gray-600 mb-8">
                        Pega el enlace de tu playlist de Spotify para generar los cartones.
                    </p>
                </div>
                
                {error && (
                    <div id="error-message" className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-3" role="alert">
                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="space-y-4">
                    <Input
                        id="playlistUrl"
                        label="URL de la Playlist de Spotify"
                        type="text"
                        value={playlistUrl}
                        onChange={(e) => {
                            setPlaylistUrl(e.target.value);
                            setError('');
                            setLoadedSongs([]);
                        }}
                        placeholder="https://open.spotify.com/playlist/..."
                        aria-describedby="error-message"
                    />
                    <div className="text-center">
                        <Button type="button" onClick={handleLoadPlaylist} disabled={isLoading || !playlistUrl.trim()} className="w-full sm:w-auto">
                            {isLoading ? 'Cargando...' : 'Cargar Playlist'}
                        </Button>
                    </div>
                </div>

                {loadedSongs.length > 0 && (
                    <div className="mt-8 text-left">
                        <h3 className="text-xl font-bold mb-4 text-center">Canciones Cargadas ({loadedSongs.length})</h3>
                        <div className="max-h-60 overflow-y-auto bg-white/50 p-4 rounded-lg border">
                            <ul className="space-y-3">
                                {loadedSongs.map((song, index) => {
                                    const parts = song.split(' - ');
                                    const title = parts[0];
                                    const artist = parts.length > 1 ? parts.slice(1).join(' - ') : 'Artista Desconocido';
                                    return (
                                        <li key={index} className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-50 transition-colors">
                                            <MusicNoteIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-gray-800 leading-tight">{title}</p>
                                                <p className="text-sm text-gray-600">{artist}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button type="button" variant="secondary" onClick={() => setCurrentScreen(GameScreen.HOME)}>
                            Volver
                        </Button>
                        <Button type="submit" disabled={loadedSongs.length === 0}>
                            Crear Partida
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateGameScreen;
