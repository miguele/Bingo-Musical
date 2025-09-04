
import React from 'react';
import { useGame } from './hooks/useGame';
import LoginScreen from './components/screens/LoginScreen';
import HomeScreen from './components/screens/HomeScreen';
import CreateGameScreen from './components/screens/CreateGameScreen';
import JoinGameScreen from './components/screens/JoinGameScreen';
import GameBoardScreen from './components/screens/GameBoardScreen';
import DJDashboardScreen from './components/screens/DJDashboardScreen';
import WinnerScreen from './components/screens/WinnerScreen';
import Header from './components/Header';
import { GameScreen } from './types';
import ToastContainer from './components/toast/ToastContainer';


const App: React.FC = () => {
    const { user, currentScreen, winner } = useGame();

    const renderScreen = () => {
        if (winner) {
            return <WinnerScreen />;
        }
        if (!user) {
            return <LoginScreen />;
        }

        switch (currentScreen) {
            case GameScreen.HOME:
                return <HomeScreen />;
            case GameScreen.CREATE_GAME:
                return <CreateGameScreen />;
            case GameScreen.JOIN_GAME:
                return <JoinGameScreen />;
            case GameScreen.GAME_BOARD:
                return <GameBoardScreen />;
            case GameScreen.DJ_DASHBOARD:
                return <DJDashboardScreen />;
            default:
                return <HomeScreen />;
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#fdf4e3] to-[#e6f0ff] min-h-screen text-gray-800">
            <ToastContainer />
            <Header />
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                {renderScreen()}
            </main>
        </div>
    );
};

export default App;