
import React from 'react';
import { useGame } from '../../hooks/useGame';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
    const { toasts } = useGame();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex flex-col items-end px-4 py-6 sm:p-6 space-y-4 pointer-events-none z-50"
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};

export default ToastContainer;
