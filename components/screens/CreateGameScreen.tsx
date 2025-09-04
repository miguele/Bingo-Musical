import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { GameScreen } from '../../types';
import MusicNoteIcon from '../icons/MusicNoteIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import SpotifyIcon from '../icons/SpotifyIcon';

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
                throw new Error('El token de Spotify no es válido o ha expirado. Por favor, recarga la página para obtener uno nuevo.');
            }
            if (response.status === 404) {
                throw new Error('Playlist no encontrada. Asegúrate de que el enlace es correcto y la playlist es pública.');
            }
            throw new Error('No se pudo obtener la información de la playlist.');
        }

        const data = await response.json();
        tracks = tracks.concat(data.items.filter((item: any) => item.track)); 
        nextUrl = data.next;
    }
    return tracks;
};


// --- Main Screen Component ---
const CreateGameScreen: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadedSongs, setLoadedSongs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const { 
        createGame, 
        setCurrentScreen, 
        spotifyAccessToken,
        isConnectingToSpotify,
        spotifyConnectionError,
        logoutFromSpotify,
    } = useGame();
    
    const handleLoadPlaylist = async () => {
        setError('');
        setLoadedSongs([]);

        if (!spotifyAccessToken) {
            setError('No se pudo conectar con Spotify. Intenta recargar la página.');
            return;
        }
        
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            setError('La URL no parece ser una playlist de Spotify válida.');
            return;
        }

        setIsLoading(true);

        try {
            const tracks = await fetchAllTracks(playlistId, spotifyAccessToken);
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
             if (e.message.includes('token')) {
                 logoutFromSpotify();
             }
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

    const renderContent = () => {
        if (isConnectingToSpotify) {
            return (
                <div className="text-center p-8">
                    <SpotifyIcon className="w-16 h-16 text-[#1DB954] mx-auto animate-pulse" />
                    <p className="mt-4 text-lg font-semibold text-gray-700">Conectando con Spotify...</p>
                </div>
            );
        }

        if (spotifyConnectionError) {
             return (
                <div className="text-center p-8">
                    <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">Error de Conexión</h2>
                    <p className="mt-2 text-gray-600">{spotifyConnectionError}</p>
                     <p className="mt-2 text-sm text-gray-500">
                        Asegúrate de que las credenciales son correctas y recarga la página.
                    </p>
                    <div className="mt-6">
                        <Button type="button" variant="secondary" onClick={() => setCurrentScreen(GameScreen.HOME)}>
                            Volver
                        </Button>
                    </div>
                </div>
            );
        }

        if (!spotifyAccessToken) {
             return (
                 <div className="text-center p-8">
                    <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">No se pudo conectar</h2>
                     <p className="mt-2 text-gray-600">No se ha podido obtener el token de Spotify. Por favor, recarga la página.</p>
                     <div className="mt-6">
                        <Button type="button" variant="secondary" onClick={() => setCurrentScreen(GameScreen.HOME)}>
                            Volver
                        </Button>
                    </div>
                </div>
             )
        }

        return (
            <>
                <div className="text-center">
                    <SpotifyIcon className="w-12 h-12 text-[#1DB954] mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Cargar Playlist</h2>
                    <p className="text-gray-600 mb-8">
                        Conexión automática exitosa. Pega el enlace de tu playlist de Spotify.
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
            </>
        );
    }

    return (
        <div className="flex justify-center items-center pt-8 md:pt-16">
            <Card className="w-full max-w-2xl">
                {renderContent()}
            </Card>
        </div>
    );
};

export default CreateGameScreen;