
import React from 'react';
import { useGame } from '../hooks/useGame';
import MusicNoteIcon from './icons/MusicNoteIcon';

const Header: React.FC = () => {
    const { user, logout, resetGame } = useGame();

    return (
        <header className="py-4 px-6 bg-white/50 backdrop-blur-md shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={resetGame}
                >
                    <MusicNoteIcon className="w-8 h-8 text-blue-500" />
                    <h1 className="text-2xl md:text-3xl font-brand text-gray-700">
                        Bingo Boda Sara & Fran
                    </h1>
                </div>
                {user && (
                    <button
                        onClick={logout}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Salir
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
