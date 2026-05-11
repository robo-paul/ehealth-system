import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const useProvideAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for existing session
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    const response = await authService.verifyToken();
                    if (response.valid) {
                        setUser(response.user);
                    }
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password, useFingerprint = true) => {
        setLoading(true);
        setError(null);
        
        try {
            let response;
            if (useFingerprint) {
                response = await authService.loginWithFingerprint(username);
            } else {
                response = await authService.loginWithPassword(username, password);
            }
            
            if (response.success) {
                setUser(response.user);
                return { success: true };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await authService.registerWithFingerprint(
                userData.username,
                userData.email,
                userData.password,
                userData.healthRecordId
            );
            
            return response;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return {
        user,
        loading,
        error,
        login,
        register,
        logout
    };
};