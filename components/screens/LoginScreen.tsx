
import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';

const LoginScreen: React.FC = () => {
    const [name, setName] = useState('');
    const { login } = useGame();

    const handleLogin = (role: 'DJ' | 'Player') => {
        if (name.trim()) {
            login(name.trim(), role);
        }
    };

    return (
        <div className="flex justify-center items-center pt-16">
            <Card className="w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Bienvenido al Bingo Musical!</h2>
                <p className="text-gray-600 mb-8">Introduce tu nombre para empezar a jugar.</p>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-6">
                        <Input
                            id="name"
                            label="Tu Nombre"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Fran"
                            autoComplete="name"
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                type="button" 
                                onClick={() => handleLogin('Player')}
                                disabled={!name.trim()}
                                className="w-full"
                            >
                                Soy un Invitado
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleLogin('DJ')}
                                disabled={!name.trim()}
                                variant="secondary"
                                className="w-full"
                            >
                                Soy el DJ
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default LoginScreen;
