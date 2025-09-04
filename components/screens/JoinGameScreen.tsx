import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { GameScreen } from '../../types';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';

const JoinGameScreen: React.FC = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { joinGame, setCurrentScreen } = useGame();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.trim()) {
            setIsLoading(true);
            const success = await joinGame(code.trim());
            if (!success) {
                setError('Código de partida no válido. ¡Inténtalo de nuevo!');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center pt-16">
            <Card className="w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Unirse a la Partida</h2>
                <p className="text-gray-600 mb-8">Introduce el código que te ha dado el DJ.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        id="gameCode"
                        label="Código de la Partida"
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        placeholder="CÓDIGO"
                        className="text-center tracking-[0.3em] uppercase"
                        maxLength={6}
                        disabled={isLoading}
                    />
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-3 text-left" role="alert">
                            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setCurrentScreen(GameScreen.HOME)} disabled={isLoading}>
                            Volver
                        </Button>
                        <Button type="submit" className="w-full" disabled={isLoading || !code.trim()}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default JoinGameScreen;