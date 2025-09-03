
import React from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import { GameScreen, User } from '../../types';

const HomeScreen: React.FC = () => {
    const { user, setCurrentScreen } = useGame();

    if (!user) return null;

    return (
        <div className="flex justify-center items-center pt-16">
            <Card className="w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Hola, {user.name}!</h2>
                <p className="text-gray-600 mb-8">¿Qué quieres hacer?</p>
                <div className="flex flex-col gap-4">
                    {user.role === 'DJ' && (
                        <Button onClick={() => setCurrentScreen(GameScreen.CREATE_GAME)}>
                            Crear Nueva Partida
                        </Button>
                    )}
                    <Button onClick={() => setCurrentScreen(GameScreen.JOIN_GAME)} variant="secondary">
                        Unirse a una Partida
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default HomeScreen;
