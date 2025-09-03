
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = "px-6 py-3 font-bold rounded-full shadow-lg transform transition-transform duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 active:scale-95",
        secondary: "bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50 focus:ring-blue-500 active:scale-95",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:scale-95"
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
