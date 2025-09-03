
import React from 'react';
import { useGame } from '../../hooks/useGame';
import StarIcon from '../icons/StarIcon';
import { BingoCell } from '../../types';

const GameBoardScreen: React.FC = () => {
    const { user, players, markCell } = useGame();

    const player = players.find(p => p.name === user?.name);

    if (!player) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold">Cargando tu cartón...</h2>
                <p>Si el problema persiste, intenta unirte de nuevo a la partida.</p>
            </div>
        );
    }
    
    const handleCellClick = (rowIndex: number, colIndex: number, cell: BingoCell) => {
      if (cell.song === "GRATIS") return;
      markCell(rowIndex, colIndex);
    }

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">¡A jugar, {user?.name}!</h2>
            <p className="text-gray-600 mb-6 text-center">Marca las canciones en tu cartón cuando las escuches.</p>

            <div className="grid grid-cols-5 gap-1 sm:gap-2 p-2 bg-white/50 rounded-lg shadow-lg">
                {player.card.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                            className={`
                                aspect-square w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32
                                flex justify-center items-center text-center p-1
                                rounded-md transition-all duration-300 ease-in-out transform
                                ${cell.marked 
                                    ? 'bg-blue-500 text-white shadow-inner scale-95' 
                                    : 'bg-white/80 hover:bg-blue-100 cursor-pointer'}
                            `}
                        >
                            {cell.song === 'GRATIS' ? (
                                <StarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
                            ) : (
                                <span className="text-xxs sm:text-xs md:text-sm font-semibold">
                                    {cell.song}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GameBoardScreen;
