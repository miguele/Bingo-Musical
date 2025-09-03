
import React from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';

const DJDashboardScreen: React.FC = () => {
    const { gameCode, players, resetGame } = useGame();

    const sortedPlayers = [...players].sort((a, b) => b.markedCount - a.markedCount);

    return (
        <div className="flex flex-col items-center gap-8">
            <Card className="w-full max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">¡Partida en Marcha!</h2>
                <p className="text-gray-600 mb-4">Comparte este código con los invitados para que se unan:</p>
                <div className="bg-white inline-block px-8 py-4 rounded-lg shadow-md border">
                    <p className="text-4xl font-bold tracking-[0.3em] text-blue-600">{gameCode}</p>
                </div>
            </Card>

            <Card className="w-full max-w-2xl">
                <h3 className="text-xl font-bold text-center mb-4">Progreso de los Jugadores</h3>
                {players.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Esperando a que se unan los jugadores...</p>
                ) : (
                    <div className="space-y-4">
                        {sortedPlayers.map((player) => (
                            <div key={player.name} className="bg-white/80 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">{player.name}</span>
                                    <span className="text-sm font-semibold text-gray-600">
                                        {player.markedCount} / 25
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(player.markedCount / 25) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
             <Button onClick={resetGame} variant="danger">
                Terminar Partida
            </Button>
        </div>
    );
};

export default DJDashboardScreen;
