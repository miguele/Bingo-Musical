
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                id={id}
                className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                {...props}
            />
        </div>
    );
};

export default Input;
