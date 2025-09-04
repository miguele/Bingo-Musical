
import React, { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { ToastMessage } from '../../types';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import XIcon from '../icons/XIcon';

interface ToastProps {
    toast: ToastMessage;
}

const ICONS = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
    error: <XCircleIcon className="w-6 h-6 text-red-500" />,
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
    const { removeToast } = useGame();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Entrance animation
        setIsVisible(true);

        // Schedule removal
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id]);

    const handleClose = () => {
        setIsVisible(false);
        // Allow time for exit animation before removing from state
        setTimeout(() => removeToast(toast.id), 300);
    };

    return (
        <div
            role="alert"
            className={`
                w-full max-w-sm bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 p-4
                flex items-start gap-3 pointer-events-auto
                transition-all duration-300 ease-in-out
                ${isVisible ? 'transform-none opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <div className="flex-shrink-0">{ICONS[toast.type]}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{toast.message}</p>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Cerrar"
                >
                    <XIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
