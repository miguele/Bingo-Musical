
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 border border-white ${className}`}>
            {children}
        </div>
    );
};

export default Card;
