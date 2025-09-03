
import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { GameScreen } from '../../types';


const CreateGameScreen: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const { createGame, setCurrentScreen } = useGame();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // A simple validation for a spotify URL could be added here
        createGame(playlistUrl);
    };

    return (
        <div className="flex justify-center items-center pt-16">
            <Card className="w-full max-w-lg text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Crear Nueva Partida</h2>
                <p className="text-gray-600 mb-8">Pega el enlace de tu playlist de Spotify para generar los cartones de bingo.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="playlistUrl"
                        label="URL de la Playlist de Spotify"
                        type="text"
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                    />
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                         <Button type="button" variant="secondary" onClick={() => setCurrentScreen(GameScreen.HOME)}>
                            Volver
                        </Button>
                        <Button type="submit" >
                            Crear Partida
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateGameScreen;
