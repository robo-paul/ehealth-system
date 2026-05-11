// src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSensor } from '../hooks/useSensor';
import authService from '../services/authService';
import api from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const { status: sensorStatus, connect, disconnect, enrollFingerprint } = useSensor();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        username: user?.username || '',
        email: user?.email || '',
        healthRecordId: user?.healthRecordId || '',
        fullName: '',
        phoneNumber: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        bloodType: '',
        allergies: ''
    });
    
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fingerprintStatus, setFingerprintStatus] = useState('not_enrolled');
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Enrollment UI state
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [enrollmentStep, setEnrollmentStep] = useState(0);
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [enrollmentInstruction, setEnrollmentInstruction] = useState('');
    const [enrollmentIcon, setEnrollmentIcon] = useState('👆');
    const [enrollmentColor, setEnrollmentColor] = useState('#3B82F6');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentError, setEnrollmentError] = useState('');
    const [statusMessages, setStatusMessages] = useState([]);
    const [enrollmentProgress, setEnrollmentProgress] = useState(0);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const addStatusMessage = (message, type = 'info') => {
        setStatusMessages(prev => [...prev, { 
            id: Date.now(), 
            message, 
            type,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/patients/${user?.id}`);
            const data = response.data;
            
            console.log('Profile data received:', data);
            
            setProfile({
                username: data.username || user?.username || '',
                email: data.email || user?.email || '',
                healthRecordId: data.health_record_id || user?.healthRecordId || '',
                fullName: data.full_name || '',
                phoneNumber: data.contact_number || '',
                address: data.address || '',
                dateOfBirth: data.date_of_birth || '',
                gender: data.gender || '',
                bloodType: data.blood_type || '',
                allergies: data.allergies || ''
            });
            
            const hasFingerprint = data.fingerprint_id !== null && data.fingerprint_id !== undefined;
            setFingerprintStatus(hasFingerprint ? 'enrolled' : 'not_enrolled');
            
        } catch (error) {
            console.error('Failed to load profile:', error);
            showMessage('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.username, user?.email, user?.healthRecordId]);

    useEffect(() => {
        if (user?.id) {
            loadProfile();
        }
    }, [loadProfile, user?.id]);

    useEffect(() => {
        if (!window.webSerialService) return;
        
        const handleEnrollStep = async (stepData) => {
            console.log('Enrollment step received:', stepData);
            
            if (stepData.step === 0 || stepData.step === 1) {
                setStatusMessages([]);
            }
            
            setEnrollmentStep(stepData.step);
            setEnrollmentMessage(stepData.message || 'Processing...');
            setEnrollmentInstruction(stepData.instruction || '');
            setEnrollmentIcon(stepData.icon || '👆');
            setEnrollmentColor(stepData.color || '#3B82F6');
            
            if (stepData.progress !== undefined) {
                setEnrollmentProgress(stepData.progress);
            }
            
            if (stepData.message) {
                const msgType = stepData.error ? 'error' : 
                               stepData.success ? 'success' : 'info';
                addStatusMessage(stepData.message, msgType);
            }
            
            if (stepData.success && stepData.userId) {
                console.log('Enrollment successful! Fingerprint ID:', stepData.userId);
                addStatusMessage(`✅ Enrollment complete! Fingerprint ID: ${stepData.userId}`, 'success');
                
                setTimeout(async () => {
                    await loadProfile();
                    setShowEnrollmentModal(false);
                    setIsEnrolling(false);
                    setEnrollmentStep(0);
                    setStatusMessages([]);
                    showMessage('success', `Fingerprint enrolled successfully with ID: ${stepData.userId}`);
                }, 2000);
            }
            
            if (stepData.error) {
                setEnrollmentError(stepData.message || 'Enrollment failed');
                addStatusMessage(`❌ ${stepData.message || 'Enrollment failed'}`, 'error');
                
                setTimeout(() => {
                    setIsEnrolling(false);
                    setEnrollmentStep(0);
                    setEnrollmentError('');
                }, 3000);
            }
        };
        
        window.webSerialService.on('enroll-step', handleEnrollStep);
        
        return () => {
            window.webSerialService.off('enroll-step', handleEnrollStep);
        };
    }, [loadProfile]);

    const handleConnectSensor = useCallback(async () => {
        setIsConnecting(true);
        const result = await connect();
        if (result.success) {
            localStorage.setItem('sensorConnected', 'true');
            showMessage('success', 'Fingerprint sensor connected!');
        } else {
            showMessage('error', `Connection failed: ${result.error}`);
        }
        setIsConnecting(false);
    }, [connect]);

    const handleDisconnectSensor = useCallback(() => {
        disconnect();
        localStorage.removeItem('sensorConnected');
        showMessage('info', 'Sensor disconnected');
    }, [disconnect]);

    useEffect(() => {
        const wasConnected = localStorage.getItem('sensorConnected') === 'true';
        if (wasConnected && !sensorStatus.connected) {
            handleConnectSensor();
        }
    }, [sensorStatus.connected, handleConnectSensor]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put(`/patients/${user?.id}`, {
                email: profile.email,
                full_name: profile.fullName,
                contact_number: profile.phoneNumber,
                address: profile.address,
                date_of_birth: profile.dateOfBirth,
                gender: profile.gender,
                blood_type: profile.bloodType,
                allergies: profile.allergies
            });
            
            if (response.data.success) {
                showMessage('success', 'Profile updated successfully');
                await loadProfile();
            } else {
                showMessage('error', response.data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showMessage('error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwords.new !== passwords.confirm) {
            showMessage('error', 'New passwords do not match');
            return;
        }
        
        if (passwords.new.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);
        try {
            const response = await authService.changePassword(passwords.current, passwords.new);
            if (response.success) {
                showMessage('success', 'Password changed successfully');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                showMessage('error', response.error || 'Failed to change password');
            }
        } catch (error) {
            showMessage('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollFingerprint = async () => {
        if (!sensorStatus.connected) {
            showMessage('error', 'Please connect the fingerprint sensor first');
            return;
        }
        
        setIsEnrolling(true);
        setShowEnrollmentModal(true);
        setEnrollmentStep(0);
        setEnrollmentError('');
        setStatusMessages([]);
        setEnrollmentProgress(0);
        setEnrollmentMessage('Initializing enrollment...');
        setEnrollmentInstruction('');
        setEnrollmentIcon('🔄');
        setEnrollmentColor('#3B82F6');
        
        try {
            const result = await enrollFingerprint();
            console.log('Enrollment result:', result);
        } catch (error) {
            setShowEnrollmentModal(false);
            setIsEnrolling(false);
            showMessage('error', error.message);
        }
    };

    const handleInputChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const getStatusIcon = (type) => {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📌';
        }
    };

    const getStepIcon = (step) => {
        const icons = {
            0: '🔄',
            1: '👆',
            2: '✋',
            3: '👆',
            4: '✅'
        };
        return icons[step] || '📌';
    };

    const getStepTitle = (step) => {
        const titles = {
            0: 'Preparing',
            1: 'First Scan',
            2: 'Remove Finger',
            3: 'Second Scan',
            4: 'Complete'
        };
        return titles[step] || 'Processing';
    };

    const EnrollmentModal = () => (
        <div className="enrollment-modal-overlay">
            <div className="enrollment-modal">
                <div className="enrollment-header">
                    <h2>🔐 Fingerprint Enrollment</h2>
                    <button 
                        className="close-btn"
                        onClick={() => {
                            if (!isEnrolling) {
                                setShowEnrollmentModal(false);
                                setIsEnrolling(false);
                                setEnrollmentStep(0);
                                setStatusMessages([]);
                            }
                        }}
                        disabled={isEnrolling}
                    >
                        ×
                    </button>
                </div>
                
                <div className="enrollment-content">
                    <div className="enrollment-progress-container">
                        <div className="enrollment-progress-bar">
                            <div 
                                className="enrollment-progress-fill"
                                style={{ 
                                    width: `${enrollmentProgress || (enrollmentStep / 4) * 100}%`,
                                    backgroundColor: enrollmentColor
                                }}
                            />
                        </div>
                        <div className="enrollment-progress-text">
                            {enrollmentProgress || Math.round((enrollmentStep / 4) * 100)}% Complete
                        </div>
                    </div>

                    {enrollmentStep > 0 && (
                        <div className="enrollment-steps">
                            {[1, 2, 3, 4].map((step) => (
                                <div 
                                    key={step}
                                    className={`step-dot ${enrollmentStep >= step ? 'active' : ''} ${enrollmentStep > step ? 'completed' : ''}`}
                                    style={{
                                        borderColor: enrollmentStep >= step ? enrollmentColor : '#E5E7EB',
                                        backgroundColor: enrollmentStep >= step ? enrollmentColor : 'transparent'
                                    }}
                                >
                                    {enrollmentStep > step ? '✓' : step}
                                </div>
                            ))}
                            <div className="step-labels">
                                <span>First Scan</span>
                                <span>Remove</span>
                                <span>Second Scan</span>
                                <span>Complete</span>
                            </div>
                        </div>
                    )}
                    
                    <div 
                        className="enrollment-instruction"
                        style={{ borderColor: enrollmentColor }}
                    >
                        <div className="enrollment-icon" style={{ fontSize: '64px' }}>
                            {enrollmentIcon || getStepIcon(enrollmentStep)}
                        </div>
                        <h3 style={{ color: enrollmentColor }}>
                            {getStepTitle(enrollmentStep)}
                        </h3>
                        <p className="enrollment-main-message">
                            {enrollmentMessage || 'Starting enrollment process...'}
                        </p>
                        {enrollmentInstruction && (
                            <p className="enrollment-sub-message">
                                {enrollmentInstruction}
                            </p>
                        )}
                    </div>
                    
                    {statusMessages.length > 0 && (
                        <div className="enrollment-status-log">
                            <h4>Status Log:</h4>
                            <div className="status-messages-container">
                                {statusMessages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`status-message status-${msg.type}`}
                                    >
                                        <span className="status-icon">
                                            {getStatusIcon(msg.type)}
                                        </span>
                                        <span className="status-text">{msg.message}</span>
                                        <span className="status-time">{msg.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {enrollmentError && (
                        <div className="enrollment-error">
                            <span>❌</span>
                            <p>{enrollmentError}</p>
                        </div>
                    )}
                    
                    {enrollmentStep === 0 && (
                        <div className="enrollment-tips">
                            <h4>💡 Tips for Successful Enrollment:</h4>
                            <ul>
                                <li>Clean the sensor surface before starting</li>
                                <li>Keep your finger clean and dry</li>
                                <li>Place your finger flat on the sensor</li>
                                <li>Apply gentle but firm pressure</li>
                                <li>Keep your finger steady during scanning</li>
                                <li>Use the same finger for both scans</li>
                                <li>Try different angles if enrollment fails</li>
                            </ul>
                        </div>
                    )}
                    
                    {enrollmentStep > 0 && enrollmentStep < 4 && (
                        <div className="waiting-animation">
                            <div className="pulse-ring" style={{ borderColor: enrollmentColor }}></div>
                            <div className="pulse-ring-delayed" style={{ borderColor: enrollmentColor }}></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading && !profile.username) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>Profile Settings</h1>
                <button onClick={logout} className="btn btn-secondary">
                    Logout
                </button>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {showEnrollmentModal && <EnrollmentModal />}

            <div className="profile-tabs">
                <button 
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile Info
                </button>
                <button 
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                <button 
                    className={`tab ${activeTab === 'fingerprint' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fingerprint')}
                >
                    Fingerprint
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'profile' && (
                    <div className="profile-info">
                        <h2>Profile Information</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group">
                                <label>Username</label>
                                <input 
                                    type="text" 
                                    value={profile.username}
                                    disabled
                                    className="readonly"
                                />
                                <small>Username cannot be changed</small>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={profile.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel"
                                        name="phoneNumber"
                                        value={profile.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="Contact number"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input 
                                        type="date"
                                        name="dateOfBirth"
                                        value={profile.dateOfBirth}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select
                                        name="gender"
                                        value={profile.gender}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Blood Type</label>
                                    <select
                                        name="bloodType"
                                        value={profile.bloodType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    name="address"
                                    value={profile.address}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="Your address"
                                />
                            </div>

                            <div className="form-group">
                                <label>Allergies</label>
                                <textarea
                                    name="allergies"
                                    value={profile.allergies}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="Any known allergies"
                                />
                            </div>

                            <div className="form-group">
                                <label>Health Record ID</label>
                                <input 
                                    type="text" 
                                    value={profile.healthRecordId}
                                    disabled
                                    className="readonly"
                                />
                                <small>Your unique health record identifier</small>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="security-settings">
                        <h2>Change Password</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    required
                                    minLength="6"
                                />
                                <small>Password must be at least 6 characters</small>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'fingerprint' && (
                    <div className="fingerprint-settings">
                        <h2>Fingerprint Authentication</h2>
                        
                        <div className="sensor-connection-section">
                            {!sensorStatus.connected ? (
                                <button 
                                    className="btn-connect-sensor"
                                    onClick={handleConnectSensor}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? 'Connecting...' : '🔌 Connect USB Fingerprint Sensor'}
                                </button>
                            ) : (
                                <div className="sensor-connected">
                                    <span className="sensor-status-connected">✅ USB Sensor Connected</span>
                                    <button 
                                        className="btn-disconnect-sensor"
                                        onClick={handleDisconnectSensor}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="fingerprint-status">
                            <div className={`status-indicator ${fingerprintStatus}`}></div>
                            <div>
                                <h3>Status: {
                                    fingerprintStatus === 'enrolled' 
                                        ? '✅ Fingerprint Enrolled' 
                                        : '❌ Not Enrolled'
                                }</h3>
                                <p>
                                    {fingerprintStatus === 'enrolled' 
                                        ? 'You can use your fingerprint to log in'
                                        : 'Enroll your fingerprint for faster login'}
                                </p>
                            </div>
                        </div>

                        {sensorStatus.connected ? (
                            fingerprintStatus === 'enrolled' ? (
                                <button 
                                    className="btn btn-secondary"
                                    onClick={handleEnrollFingerprint}
                                    disabled={loading || isEnrolling}
                                >
                                    {isEnrolling ? 'Enrolling...' : 'Re-enroll Fingerprint'}
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleEnrollFingerprint}
                                    disabled={loading || isEnrolling}
                                >
                                    {isEnrolling ? 'Starting Enrollment...' : 'Enroll Fingerprint'}
                                </button>
                            )
                        ) : (
                            <div className="sensor-warning">
                                ⚠️ Fingerprint sensor not connected. 
                                Click "Connect USB Fingerprint Sensor" to begin enrollment.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;