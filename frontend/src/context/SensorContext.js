import React, { createContext } from 'react';
import { useSensor } from '../hooks/useSensor';

export const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
    const sensor = useSensor();
    
    return (
        <SensorContext.Provider value={sensor}>
            {children}
        </SensorContext.Provider>
    );
};