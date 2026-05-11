// src/components/common/SkeletonLoader.js
import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch(type) {
            case 'card':
                return (
                    <div className="skeleton-card">
                        <div className="skeleton-image"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                    </div>
                );
            case 'list':
                return (
                    <div className="skeleton-list">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="skeleton-profile">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-content">
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line"></div>
                        </div>
                    </div>
                );
            default:
                return <div className="skeleton-line"></div>;
        }
    };

    return (
        <div className="skeleton-container">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="skeleton-item">
                    {renderSkeleton()}
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;