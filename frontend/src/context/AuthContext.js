// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user) {
            console.log('👤 Current user:', {
                id: user.id,
                username: user.username,
                role: user.role
            });
        }
    }, [user]);

    const checkUser = () => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    };

    // Helper function to redirect based on role
    const redirectBasedOnRole = (role) => {
        console.log('🔄 Redirecting based on role:', role);
        
        switch(role) {
            case 'master_admin':
                navigate('/admin');
                break;
            case 'doctor':
                navigate('/doctor/dashboard');
                break;
            case 'nurse':
                navigate('/nurse');
                break;
            case 'receptionist':
                navigate('/receptionist');
                break;
            case 'pharmacist':
                navigate('/pharmacist');
                break;
            case 'lab_technician':
                navigate('/lab');
                break;
            case 'radiologist':
                navigate('/radiologist');
                break;
            case 'billing_officer':
                navigate('/billing');
                break;
            case 'ict_admin':
                navigate('/admin');
                break;
            case 'patient':
            default:
                navigate('/dashboard');
                break;
        }
    };

    const login = async (username, password, useFingerprint = false, fingerprintId = null, fingerprintOnly = false) => {
        setLoading(true);
        setError(null);
        try {
            let response;
            
            if (fingerprintOnly) {
                console.log('Attempting fingerprint-only login...');
                response = await authService.loginWithFingerprintOnly(fingerprintId);
            } else if (useFingerprint) {
                response = await authService.loginWithFingerprint(username, fingerprintId);
            } else {
                response = await authService.loginWithPassword(username, password);
            }
            
            if (response.success) {
                console.log('✅ Login successful, user role:', response.user.role);
                setUser(response.user);
                
                // Redirect based on role
                redirectBasedOnRole(response.user.role);
                return { success: true };
            } else {
                setError(response.error);
                return { success: false, error: response.error };
            }
        } catch (err) {
            console.error('Login error:', err);
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
            const response = await authService.register(userData);
            if (response.success) {
                navigate('/login?registered=true');
                return { success: true };
            }
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
        navigate('/');
    };

    const refreshUser = async () => {
        const refreshedUser = await authService.refreshUser();
        if (refreshedUser) {
            setUser(refreshedUser);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};