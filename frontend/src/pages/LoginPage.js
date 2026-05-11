// frontend/src/pages/LoginPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSensor } from '../hooks/useSensor';
import FingerprintAuth from '../components/auth/FingerprintAuth';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginMethod, setLoginMethod] = useState('fingerprint'); // 'fingerprint' or 'password'
    const [localError, setLocalError] = useState('');
    const [showFingerprintModal, setShowFingerprintModal] = useState(false);
    const [sensorConnected, setSensorConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [scanStatus, setScanStatus] = useState(null);
    
    const { login, loading, error } = useAuth();
    const { status: sensorStatus, connect, disconnect, isSupported } = useSensor();

    // Define handleFingerprintSuccess before it's used in useEffect
    const handleFingerprintSuccess = useCallback(async (result) => {
        console.log('Fingerprint scan successful:', result);
        
        const fingerprintId = result.userId;
        
        if (!fingerprintId) {
            setLocalError('Fingerprint recognized but no ID found');
            setShowFingerprintModal(false);
            setScanStatus(null);
            return;
        }
        
        // Call login with fingerprint ONLY - NO USERNAME REQUIRED
        const loginResult = await login(null, null, true, fingerprintId, true);
        
        if (!loginResult.success) {
            setLocalError(loginResult.error);
            setScanStatus(null);
            setShowFingerprintModal(false);
            // Auto-retry after error if sensor still connected
            setTimeout(() => {
                if (sensorConnected && loginMethod === 'fingerprint' && !loading) {
                    setShowFingerprintModal(true);
                }
            }, 2000);
        } else {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'master_admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [login, navigate, sensorConnected, loginMethod, loading]);

    // Update sensor connected state
    useEffect(() => {
        console.log('Sensor status changed:', sensorStatus.connected);
        setSensorConnected(sensorStatus.connected);
        if (!sensorStatus.connected && loginMethod === 'fingerprint') {
            setScanStatus(null);
            setShowFingerprintModal(false);
        }
    }, [sensorStatus.connected, loginMethod]);

    // Listen for scan status updates from sensor
    useEffect(() => {
        if (!window.webSerialService) return;
        
        const handleScanStatus = (status) => {
            console.log('Scan status update:', status);
            setScanStatus(status);
            
            if (status.status === 'success') {
                setTimeout(() => {
                    setShowFingerprintModal(false);
                    handleFingerprintSuccess(status);
                }, 1000);
            }
        };
        
        window.webSerialService.on('scan-status', handleScanStatus);
        
        return () => {
            window.webSerialService.off('scan-status', handleScanStatus);
        };
    }, [handleFingerprintSuccess]);

    // Auto-start fingerprint scan when sensor connects and fingerprint mode is active
    useEffect(() => {
        if (sensorConnected && loginMethod === 'fingerprint' && !showFingerprintModal && !loading) {
            const timer = setTimeout(() => {
                console.log('Auto-starting fingerprint scan');
                setShowFingerprintModal(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sensorConnected, loginMethod, showFingerprintModal, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setScanStatus(null);

        if (loginMethod === 'fingerprint') {
            // Fingerprint-only mode - NO USERNAME NEEDED
            if (!sensorConnected) {
                setLocalError('Please connect the fingerprint sensor first');
                return;
            }
            console.log('Starting fingerprint authentication (no username required)');
            setShowFingerprintModal(true);
        } else {
            // Password login
            if (!username) {
                setLocalError('Username is required');
                return;
            }
            if (!password) {
                setLocalError('Password is required');
                return;
            }
            const result = await login(username, password, false);
            if (!result.success) {
                setLocalError(result.error);
            }
        }
    };

    const handleFingerprintError = useCallback((error) => {
        console.log('Fingerprint error:', error);
        setShowFingerprintModal(false);
        setScanStatus(null);
        setLocalError(error.message || 'Fingerprint authentication failed');
        
        // Auto-retry after error
        setTimeout(() => {
            if (sensorConnected && loginMethod === 'fingerprint' && !loading) {
                setShowFingerprintModal(true);
            }
        }, 2000);
    }, [sensorConnected, loginMethod, loading]);

    const handleConnectSensor = async () => {
        setIsConnecting(true);
        setLocalError('');
        
        try {
            const result = await connect();
            if (!result.success) {
                if (result.error?.includes('No port selected') || result.error?.includes('user cancelled')) {
                    setLocalError('No port selected. Please select a port to connect.');
                } else {
                    setLocalError(`Connection failed: ${result.error}`);
                }
            } else {
                setSensorConnected(true);
                setLocalError('');
            }
        } catch (err) {
            setLocalError(`Connection error: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnectSensor = () => {
        disconnect();
        setSensorConnected(false);
        setScanStatus(null);
        setLocalError('');
        setShowFingerprintModal(false);
    };

    const switchToFingerprint = () => {
        setLoginMethod('fingerprint');
        setUsername('');
        setPassword('');
        setLocalError('');
        setScanStatus(null);
        // Auto-start scan if sensor is connected
        if (sensorConnected) {
            setTimeout(() => setShowFingerprintModal(true), 300);
        }
    };

    const switchToPassword = () => {
        setLoginMethod('password');
        setShowFingerprintModal(false);
        setScanStatus(null);
        setLocalError('');
    };

    const getScanStatusDisplay = () => {
        if (!scanStatus) return null;
        
        switch(scanStatus.status) {
            case 'waiting':
                return (
                    <div className="scan-status waiting">
                        <div className="scan-animation">
                            <div className="fingerprint-icon">👆</div>
                            <div className="pulse-wave"></div>
                        </div>
                        <div className="scan-message">
                            <strong>Place your finger on the sensor</strong>
                            <p>No username needed - we'll identify you automatically</p>
                        </div>
                    </div>
                );
            case 'detected':
                return (
                    <div className="scan-status detected">
                        <div className="scan-animation">
                            <div className="fingerprint-icon">🔍</div>
                        </div>
                        <div className="scan-message">
                            <strong>Fingerprint detected!</strong>
                            <p>Identifying user...</p>
                        </div>
                    </div>
                );
            case 'success':
                return (
                    <div className="scan-status success">
                        <div className="success-icon">✅</div>
                        <div className="scan-message">
                            <strong>Fingerprint recognized!</strong>
                            <p>Confidence: {scanStatus.confidence}%</p>
                            <p>Logging you in...</p>
                        </div>
                    </div>
                );
            case 'failed':
                return (
                    <div className="scan-status failed">
                        <div className="error-icon">❌</div>
                        <div className="scan-message">
                            <strong>Fingerprint not recognized</strong>
                            <p>{scanStatus.instruction || 'Please try again'}</p>
                            <p className="hint">Make sure your finger is clean and placed correctly</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>E-Health System</h2>
                <p className="subtitle" style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                    Secure Access to Your Health Records
                </p>
                
                {/* Login Method Toggle */}
                <div className="login-method-toggle">
                    <button
                        className={`method-btn ${loginMethod === 'fingerprint' ? 'active' : ''}`}
                        onClick={switchToFingerprint}
                        disabled={loading}
                    >
                        🔐 Fingerprint Login
                    </button>
                    <button
                        className={`method-btn ${loginMethod === 'password' ? 'active' : ''}`}
                        onClick={switchToPassword}
                        disabled={loading}
                    >
                        📝 Password Login
                    </button>
                </div>
                
                {/* Sensor Connection Section (only show in fingerprint mode) */}
                {loginMethod === 'fingerprint' && (
                    <div className="sensor-status-section">
                        {!isSupported ? (
                            <div className="sensor-warning">
                                ⚠️ Web Serial not supported. Please use Chrome or Edge browser.
                            </div>
                        ) : !sensorConnected ? (
                            <button 
                                type="button"
                                className="btn-connect"
                                onClick={handleConnectSensor}
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Connecting...
                                    </>
                                ) : (
                                    '🔌 Connect USB Fingerprint Sensor'
                                )}
                            </button>
                        ) : (
                            <div className="sensor-badge">
                                <span className="sensor-dot"></span>
                                <span className="sensor-name">Fingerprint Sensor Ready</span>
                                <button 
                                    type="button"
                                    className="sensor-disconnect"
                                    onClick={handleDisconnectSensor}
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Error/Success Messages */}
                {(localError || error) && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {localError || error}
                    </div>
                )}

                {/* Scan Status Display */}
                {loginMethod === 'fingerprint' && showFingerprintModal && getScanStatusDisplay()}

                {/* Fingerprint Login Form */}
                {loginMethod === 'fingerprint' && !showFingerprintModal && (
                    <form onSubmit={handleSubmit}>
                        <div className="fingerprint-prompt" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔐</div>
                            <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '500' }}>
                                {sensorConnected ? 'Fingerprint Sensor Ready' : 'Connect Your Fingerprint Sensor'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                                {sensorConnected 
                                    ? 'Place your finger on the sensor to login instantly' 
                                    : 'Please connect the fingerprint sensor to use this feature'}
                            </p>
                            {sensorConnected && (
                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Authenticating...
                                        </>
                                    ) : (
                                        '🔓 Start Fingerprint Authentication'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Password Login Form */}
                {loginMethod === 'password' && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block"
                            disabled={loading || !username || !password}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Logging in...
                                </>
                            ) : (
                                'Login with Password'
                            )}
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>Don't have an account? <a href="/register">Register here</a></p>
                    <p><a href="/">Back to Home</a></p>
                </div>
            </div>

            {/* Fingerprint Authentication Modal */}
            {loginMethod === 'fingerprint' && showFingerprintModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button 
                            className="modal-close" 
                            onClick={() => {
                                setShowFingerprintModal(false);
                                setScanStatus(null);
                            }}
                        >
                            ×
                        </button>
                        <FingerprintAuth 
                            onSuccess={handleFingerprintSuccess}
                            onError={handleFingerprintError}
                            scanStatus={scanStatus}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;