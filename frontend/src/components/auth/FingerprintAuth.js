// src/components/auth/FingerprintAuth.js
import React, { useState, useEffect } from 'react';
import { useSensor } from '../../hooks/useSensor';
import './FingerprintAuth.css';

const FingerprintAuth = ({ onSuccess, onError, scanStatus: externalScanStatus }) => {
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [instruction, setInstruction] = useState('');
    const [scanAttempts, setScanAttempts] = useState(0);
    const { 
        status: sensorStatus, 
        loading, 
        scanFingerprint,
        isSupported 
    } = useSensor();

    // Log sensor status on mount and when it changes
    useEffect(() => {
        console.log('FingerprintAuth - Sensor status:', sensorStatus);
        
        if (!sensorStatus.connected) {
            setStatus('disconnected');
            setMessage('⚠️ Fingerprint sensor not connected');
            setInstruction('Please connect the fingerprint sensor from the login page');
        } else {
            setStatus('ready');
            setMessage('Sensor ready');
            setInstruction('Click "Scan Fingerprint" to begin authentication');
        }
    }, [sensorStatus]);

    // Listen for external scan status updates (from webSerialService)
    useEffect(() => {
        if (externalScanStatus) {
            console.log('External scan status update:', externalScanStatus);
            
            switch(externalScanStatus.status) {
                case 'waiting':
                    setStatus('waiting');
                    setMessage('Waiting for fingerprint...');
                    setInstruction(externalScanStatus.instruction || 'Place your finger on the sensor');
                    break;
                case 'success':
                    setStatus('success');
                    setMessage(externalScanStatus.message || 'Fingerprint recognized!');
                    setInstruction('Authentication successful');
                    if (onSuccess) {
                        setTimeout(() => {
                            onSuccess(externalScanStatus);
                        }, 500);
                    }
                    break;
                case 'failed':
                    setStatus('error');
                    setMessage(externalScanStatus.message || 'Fingerprint not recognized');
                    setInstruction(externalScanStatus.instruction || 'Please try again');
                    setScanAttempts(prev => prev + 1);
                    break;
                default:
                    break;
            }
        }
    }, [externalScanStatus, onSuccess]);

    const handleScan = async () => {
        console.log('Starting fingerprint scan...');
        
        if (!sensorStatus.connected) {
            setStatus('error');
            setMessage('⚠️ Fingerprint sensor not connected');
            setInstruction('Please connect the sensor from the login page');
            if (onError) onError(new Error('Sensor not connected'));
            return;
        }
        
        setStatus('scanning');
        setMessage('🔍 Scanning...');
        setInstruction('Please place your finger firmly on the sensor');
        
        try {
            const result = await scanFingerprint();
            console.log('Scan result:', result);
            
            if (result.success) {
                setStatus('success');
                setMessage(`✅ Fingerprint recognized!`);
                setInstruction(`Confidence: ${result.confidence}%`);
                if (onSuccess) onSuccess(result);
            }
        } catch (error) {
            console.error('Scan error:', error);
            setStatus('error');
            setScanAttempts(prev => prev + 1);
            
            if (error.message.includes('No match')) {
                setMessage('❌ Fingerprint not recognized');
                setInstruction('Please try again or use password login');
            } else if (error.message.includes('timeout')) {
                setMessage('❌ Scan timeout');
                setInstruction('Please place your finger on the sensor and hold steady');
            } else {
                setMessage(`❌ Scan failed`);
                setInstruction(error.message);
            }
            if (onError) onError(error);
        }
    };

    const getStatusIcon = () => {
        switch(status) {
            case 'waiting':
                return '👆';
            case 'scanning':
                return '🔍';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'disconnected':
                return '🔌';
            default:
                return '🔐';
        }
    };

    const getStatusColor = () => {
        switch(status) {
            case 'waiting':
                return '#3B82F6';
            case 'scanning':
                return '#F59E0B';
            case 'success':
                return '#10B981';
            case 'error':
                return '#EF4444';
            case 'disconnected':
                return '#6B7280';
            default:
                return '#8B5CF6';
        }
    };

    if (!isSupported) {
        return (
            <div className="auth-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <div>
                        <strong>Browser Not Supported</strong>
                        <p>Web Serial is not supported. Please use Chrome or Edge browser.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="fingerprint-card">
                <div className="fingerprint-header">
                    <h3>Fingerprint Authentication</h3>
                    {sensorStatus.connected && (
                        <div className="sensor-badge">
                            <span className="sensor-dot"></span>
                            Sensor Connected
                        </div>
                    )}
                </div>

                <div className="fingerprint-animation-section">
                    <div 
                        className={`fingerprint-icon ${status} ${status === 'waiting' ? 'pulse' : ''}`}
                        style={{ borderColor: getStatusColor() }}
                    >
                        <div className="icon-wrapper" style={{ color: getStatusColor() }}>
                            {getStatusIcon()}
                        </div>
                    </div>
                    
                    {/* Scanning animation lines */}
                    {status === 'scanning' && (
                        <div className="scanning-lines">
                            <div className="scan-line"></div>
                            <div className="scan-line delay-1"></div>
                            <div className="scan-line delay-2"></div>
                        </div>
                    )}
                    
                    {/* Waiting pulse rings */}
                    {status === 'waiting' && (
                        <div className="pulse-rings">
                            <div className="pulse-ring"></div>
                            <div className="pulse-ring delay-1"></div>
                            <div className="pulse-ring delay-2"></div>
                        </div>
                    )}
                </div>

                <div className="status-section">
                    <div className="status-message" style={{ color: getStatusColor() }}>
                        <strong>{message || 'Ready to authenticate'}</strong>
                        {instruction && <p>{instruction}</p>}
                    </div>

                    {!sensorStatus.connected ? (
                        <div className="sensor-not-connected">
                            <p>⚠️ Fingerprint sensor not connected</p>
                            <p className="hint">Please connect the sensor from the login page first</p>
                        </div>
                    ) : (
                        <button 
                            className={`btn-primary ${status === 'scanning' ? 'loading' : ''}`}
                            onClick={handleScan}
                            disabled={loading || status === 'scanning' || status === 'waiting'}
                        >
                            {status === 'scanning' ? (
                                <>
                                    <span className="spinner"></span>
                                    Scanning...
                                </>
                            ) : status === 'waiting' ? (
                                'Waiting for finger...'
                            ) : (
                                '🔍 Scan Fingerprint'
                            )}
                        </button>
                    )}

                    {scanAttempts > 0 && status === 'error' && (
                        <div className="retry-hint">
                            <p>💡 Tips for successful scan:</p>
                            <ul>
                                <li>Make sure your finger is clean and dry</li>
                                <li>Place your finger flat on the sensor</li>
                                <li>Hold steady until scan completes</li>
                                <li>Try a different finger if enrolled</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FingerprintAuth;