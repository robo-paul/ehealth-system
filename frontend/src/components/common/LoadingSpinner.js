// src/components/common/LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
    const sizes = {
        small: '20px',
        medium: '40px',
        large: '60px'
    };

    return (
        <div className="loading-container">
            <div 
                className="loading-spinner"
                style={{
                    width: sizes[size],
                    height: sizes[size],
                    borderWidth: size === 'small' ? '2px' : '3px'
                }}
            />
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;