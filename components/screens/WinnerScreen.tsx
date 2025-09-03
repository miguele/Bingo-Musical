
import React from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';

const WinnerScreen: React.FC = () => {
    const { winner, resetGame, user } = useGame();

    return (
        <div className="flex justify-center items-center pt-16">
            <Card className="w-full max-w-md text-center animate-pulse">
                 <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-brand text-blue-600 mb-2">¡BINGO!</h2>
                <p className="text-2xl font-bold text-gray-800 mb-8">
                   ¡Felicidades, {winner?.name}!
                </p>
                <p className="text-gray-600 mb-6">Has completado tu cartón y ganado la partida.</p>
                <Button onClick={resetGame}>
                    {user?.role === 'DJ' ? 'Crear Nueva Partida' : 'Jugar de Nuevo'}
                </Button>
            </Card>
        </div>
    );
};

export default WinnerScreen;
