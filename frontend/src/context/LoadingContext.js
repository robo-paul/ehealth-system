// src/context/LoadingContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within LoadingProvider');
    }
    return context;
};

export const LoadingProvider = ({ children }) => {
    const [loadingStates, setLoadingStates] = useState({});

    const startLoading = useCallback((key) => {
        setLoadingStates(prev => ({ ...prev, [key]: true }));
    }, []);

    const stopLoading = useCallback((key) => {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
    }, []);

    const isLoading = useCallback((key) => {
        return loadingStates[key] || false;
    }, [loadingStates]);

    const withLoading = useCallback(async (key, promise) => {
        try {
            startLoading(key);
            return await promise;
        } finally {
            stopLoading(key);
        }
    }, [startLoading, stopLoading]);

    return (
        <LoadingContext.Provider value={{
            isLoading,
            startLoading,
            stopLoading,
            withLoading
        }}>
            {children}
        </LoadingContext.Provider>
    );
};