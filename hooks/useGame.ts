
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { GameContextType } from '../types';

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame debe ser usado dentro de un GameProvider');
    }
    return context;
};
