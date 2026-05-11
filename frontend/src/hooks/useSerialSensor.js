// src/hooks/useSerialSensor.js
import { useState, useCallback, useEffect } from 'react';
import sensorService from '../services/sensorService';

export const useSerialSensor = () => {
    const [status, setStatus] = useState(sensorService.getStatus());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Listen for connection status changes
    useEffect(() => {
        const handleStatusChange = (newStatus) => {
            setStatus({ connected: newStatus.connected, port: 'USB Serial' });
        };
        
        sensorService.addListener(handleStatusChange);
        return () => sensorService.removeListener(handleStatusChange);
    }, []);

    const connect = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await sensorService.connect();
            if (!result.success) {
                setError(result.error);
                return { success: false, error: result.error };
            }
            setStatus({ connected: true, port: 'USB Serial' });
            return { success: true };
        } catch (err) {
            const errorMsg = err.message || 'Connection failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        sensorService.disconnect();
        setStatus({ connected: false, port: 'USB Serial' });
    }, []);

    const scanFingerprint = useCallback(async () => {
        if (!status.connected) {
            throw new Error('Not connected to device');
        }
        
        setLoading(true);
        try {
            return await sensorService.scanFingerprint();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [status.connected]);

    const enrollFingerprint = useCallback(async () => {
        if (!status.connected) {
            throw new Error('Not connected to device');
        }
        
        setLoading(true);
        try {
            return await sensorService.enrollFingerprint();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [status.connected]);

    return {
        status,
        loading,
        error,
        connect,
        disconnect,
        scanFingerprint,
        enrollFingerprint,
        isSerialSupported: !!navigator.serial
    };
};