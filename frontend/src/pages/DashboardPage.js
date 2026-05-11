// src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { useSensor } from '../hooks/useSensor';
import api from '../services/api';
import FileAttachment from '../components/health-records/FileAttachment';
import healthRecordService from '../services/healthRecordService';
import appointmentService from '../services/appointmentService';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import PrescriptionList from '../components/prescriptions/PrescriptionList';
import SkeletonLoader from '../components/common/SkeletonLoader';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { loading: roleLoading } = useRole();
    const { showSuccess, showError } = useToast();
    const { status: sensorStatus, connect } = useSensor();
    
    const [activeTab, setActiveTab] = useState('clinical');
    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState('');
    const [attachments, setAttachments] = useState({});
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsError, setAppointmentsError] = useState('');
    const [showSensorPrompt, setShowSensorPrompt] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [setFingerprintStatus] = useState('not_enrolled');
    const [patientInfo, setPatientInfo] = useState({
        fullName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        bloodType: '',
        allergies: '',
        phoneNumber: '',
        email: '',
        address: '',
        emergencyContact: '',
        healthRecordId: ''
    });
    const [stats, setStats] = useState({
        totalRecords: 0,
        totalAppointments: 0,
        totalPrescriptions: 0
    });
    const [financialInfo, setFinancialInfo] = useState({
        totalBilled: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        recentInvoices: []
    });

    const fetchPatientInfo = useCallback(async () => {
        try {
            const response = await api.get(`/patients/${user?.id}`);
            const data = response.data;
            
            // Calculate age from date of birth
            let age = '';
            if (data.date_of_birth) {
                const birthDate = new Date(data.date_of_birth);
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                age = `${calculatedAge} years`;
            }
            
            setPatientInfo({
                fullName: data.full_name || data.username || user?.username || '',
                age: age,
                dateOfBirth: data.date_of_birth || '',
                gender: data.gender || 'Not specified',
                bloodType: data.blood_type || 'Not recorded',
                allergies: data.allergies || 'None reported',
                phoneNumber: data.contact_number || 'Not provided',
                email: data.email || user?.email || 'Not provided',
                address: data.address || 'Not provided',
                emergencyContact: data.emergency_contact || 'Not provided',
                healthRecordId: data.health_record_id || user?.healthRecordId || ''
            });
            
            // Check fingerprint status
            setFingerprintStatus(data.fingerprint_id ? 'enrolled' : 'not_enrolled');
            
        } catch (error) {
            console.error('Failed to fetch patient info:', error);
            showError('Failed to load profile information');
        }
    }, [user?.id, user?.username, user?.email, user?.healthRecordId, showError, setFingerprintStatus]);

    const fetchFinancialInfo = useCallback(async () => {
        try {
            const response = await api.get('/patients/financial-info');
            setFinancialInfo(response.data);
        } catch (error) {
            console.error('Failed to fetch financial info:', error);
        }
    }, []);

    const fetchAttachments = useCallback(async (recordId) => {
        try {
            const data = await healthRecordService.getAttachments(recordId);
            setAttachments(prev => ({ ...prev, [recordId]: data }));
        } catch (error) {
            console.error('Failed to fetch attachments:', error);
        }
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            setRecordsLoading(true);
            const data = await healthRecordService.getRecords();
            setRecords(data || []);
            setStats(prev => ({ ...prev, totalRecords: data?.length || 0 }));
            
            if (data && data.length > 0) {
                data.forEach(record => {
                    fetchAttachments(record.id);
                });
            }
            setRecordsError('');
        } catch (err) {
            console.error('Failed to load health records:', err);
            setRecordsError('Unable to load health records');
        } finally {
            setRecordsLoading(false);
        }
    }, [fetchAttachments]);

    const fetchAppointments = useCallback(async () => {
        try {
            setAppointmentsLoading(true);
            const data = await appointmentService.getAppointments();
            setStats(prev => ({ ...prev, totalAppointments: data?.length || 0 }));
            setAppointmentsError('');
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setAppointmentsError('Failed to load appointments');
        } finally {
            setAppointmentsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!roleLoading && user) {
            // Only show for patients
            if (user.role !== 'patient') {
                const roleRoutes = {
                    doctor: '/doctor/dashboard',
                    nurse: '/nurse',
                    receptionist: '/receptionist',
                    pharmacist: '/pharmacist',
                    lab_technician: '/lab',
                    radiologist: '/radiologist',
                    billing_officer: '/billing',
                    master_admin: '/admin'
                };
                const redirectPath = roleRoutes[user.role];
                if (redirectPath) {
                    navigate(redirectPath);
                    return;
                }
            }
            
            fetchPatientInfo();
            fetchRecords();
            fetchFinancialInfo();
            fetchAppointments();
        }
    }, [roleLoading, user, navigate, fetchPatientInfo, fetchRecords, fetchFinancialInfo, fetchAppointments]);

    useEffect(() => {
        const wasConnected = localStorage.getItem('sensorConnected') === 'true';
        if (wasConnected && !sensorStatus.connected) {
            setShowSensorPrompt(true);
        }
    }, [sensorStatus.connected]);

    const handleConnectSensor = async () => {
        setIsConnecting(true);
        try {
            const result = await connect();
            if (result.success) {
                localStorage.setItem('sensorConnected', 'true');
                showSuccess('Fingerprint sensor connected!');
                setShowSensorPrompt(false);
            } else {
                showError(`Connection failed: ${result.error}`);
            }
        } catch (err) {
            showError(`Connection error: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDismissSensor = () => {
        setShowSensorPrompt(false);
        localStorage.removeItem('sensorConnected');
    };

    const getRecordTypeIcon = (type) => {
        const icons = {
            general: '📋',
            prescription: '💊',
            lab_result: '🔬',
            imaging: '🖼️',
            vaccination: '💉'
        };
        return icons[type] || '📄';
    };

    const getRecordTypeColor = (type) => {
        const colors = {
            general: '#667eea',
            prescription: '#48bb78',
            lab_result: '#4299e1',
            imaging: '#ed8936',
            vaccination: '#9f7aea'
        };
        return colors[type] || '#718096';
    };

    const goToProfile = () => {
        navigate('/profile');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const renderHealthRecords = () => {
        if (recordsLoading) {
            return <SkeletonLoader type="card" count={3} />;
        }

        if (recordsError) {
            return <div className="error-message">{recordsError}</div>;
        }

        if (!records || records.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>No Health Records Yet</h3>
                    <p>Your health records will appear here once they are added by healthcare providers.</p>
                </div>
            );
        }

        return (
            <div className="records-grid">
                {records.map((record) => {
                    let recordData = record.record_data;
                    let title = '';
                    let description = '';
                    let recordType = record.record_type || 'general';
                    
                    if (typeof recordData === 'string') {
                        try {
                            const parsed = JSON.parse(recordData);
                            title = parsed.title || '';
                            description = parsed.text || parsed.description || '';
                            recordType = parsed.type || recordType;
                        } catch (e) {
                            description = recordData;
                            title = recordData.substring(0, 50) || 'Health Record';
                        }
                    } else if (recordData && typeof recordData === 'object') {
                        title = recordData.title || '';
                        description = recordData.text || recordData.description || '';
                        recordType = recordData.type || recordType;
                    }
                    
                    if (!title && description) {
                        title = description.substring(0, 50);
                        if (description.length > 50) title += '...';
                    }
                    
                    return (
                        <div key={record.id} className="record-card">
                            <div className="record-card-header">
                                <div className="record-type-badge" style={{ backgroundColor: getRecordTypeColor(recordType) }}>
                                    {getRecordTypeIcon(recordType)}
                                    <span>{recordType.replace('_', ' ').toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="record-card-body">
                                <h3>{title || 'Untitled Record'}</h3>
                                <div className="record-meta">
                                    <span className="record-date">
                                        📅 {formatDate(record.created_at)}
                                    </span>
                                </div>
                                {description && (
                                    <p className="record-description">{description}</p>
                                )}
                                <FileAttachment 
                                    recordId={record.id}
                                    attachments={attachments[record.id] || []}
                                    onAttachmentChange={() => fetchAttachments(record.id)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderAppointments = () => {
        if (appointmentsLoading) {
            return <SkeletonLoader type="card" count={2} />;
        }

        if (appointmentsError) {
            return <div className="error-message">{appointmentsError}</div>;
        }

        return <AppointmentCalendar />;
    };

    if (roleLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    // Only show patient dashboard for patients
    if (user?.role !== 'patient') {
        return null;
    }

    return (
        <div className="dashboard-page">
            {/* Sensor Connection Prompt */}
            {showSensorPrompt && (
                <div className="sensor-prompt-overlay">
                    <div className="sensor-prompt">
                        <div className="sensor-prompt-icon">🔌</div>
                        <h3>Reconnect Fingerprint Sensor?</h3>
                        <p>Your fingerprint sensor was previously connected. Connect now for quick authentication?</p>
                        <div className="sensor-prompt-actions">
                            <button className="btn-primary" onClick={handleConnectSensor} disabled={isConnecting}>
                                {isConnecting ? 'Connecting...' : 'Yes, Connect'}
                            </button>
                            <button className="btn-secondary" onClick={handleDismissSensor}>Not Now</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Profile Header */}
            <div className="patient-profile-header">
                <div className="patient-avatar">
                    <div className="avatar-circle">
                        {patientInfo.fullName ? patientInfo.fullName.charAt(0).toUpperCase() : '👤'}
                    </div>
                </div>
                <div className="patient-info-summary">
                    <h1>{patientInfo.fullName}</h1>
                    <div className="patient-badges">
                        <span className="badge age">🎂 {patientInfo.age}</span>
                        <span className="badge gender">⚥ {patientInfo.gender}</span>
                        <span className="badge blood">🩸 Blood: {patientInfo.bloodType}</span>
                        <span className="badge id">🆔 ID: {patientInfo.healthRecordId}</span>
                    </div>
                </div>
                <button className="profile-edit-btn" onClick={goToProfile}>
                    👤 Edit Profile
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalRecords}</div>
                        <div className="stat-label">Health Records</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalAppointments}</div>
                        <div className="stat-label">Appointments</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💊</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalPrescriptions}</div>
                        <div className="stat-label">Prescriptions</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clinical')}
                >
                    <span className="tab-icon">🏥</span>
                    <span>Clinical</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                    onClick={() => setActiveTab('social')}
                >
                    <span className="tab-icon">👥</span>
                    <span>Social</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contact')}
                >
                    <span className="tab-icon">📞</span>
                    <span>Contact</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="dashboard-content">
                {/* Clinical Tab */}
                {activeTab === 'clinical' && (
                    <div className="content-panel">
                        {/* Medical Information Section */}
                        <div className="info-section">
                            <h3>Medical Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Blood Type</label>
                                    <span>{patientInfo.bloodType}</span>
                                </div>
                                <div className="info-item">
                                    <label>Allergies</label>
                                    <span>{patientInfo.allergies}</span>
                                </div>
                                <div className="info-item">
                                    <label>Date of Birth</label>
                                    <span>{formatDate(patientInfo.dateOfBirth)}</span>
                                </div>
                                <div className="info-item">
                                    <label>Gender</label>
                                    <span>{patientInfo.gender}</span>
                                </div>
                            </div>
                        </div>

                        {/* Health Records Section */}
                        <div className="records-section">
                            <h3>Health Records</h3>
                            {renderHealthRecords()}
                        </div>

                        {/* Prescriptions Section */}
                        <div className="prescriptions-section">
                            <h3>Prescriptions</h3>
                            <PrescriptionList />
                        </div>
                    </div>
                )}

                {/* Social Tab */}
                {activeTab === 'social' && (
                    <div className="content-panel">
                        {/* Emergency Contact Section */}
                        <div className="info-section">
                            <h3>Emergency Contact</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Emergency Contact</label>
                                    <span>{patientInfo.emergencyContact}</span>
                                </div>
                            </div>
                        </div>

                        {/* Appointments Section */}
                        <div className="appointments-section">
                            <h3>Appointments</h3>
                            {renderAppointments()}
                        </div>

                        {/* Financial Summary */}
                        <div className="financial-section">
                            <h3>Financial Summary</h3>
                            <div className="financial-cards">
                                <div className="financial-card">
                                    <div className="financial-icon">💰</div>
                                    <div className="financial-details">
                                        <div className="financial-label">Total Billed</div>
                                        <div className="financial-amount">${financialInfo.totalBilled.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="financial-card success">
                                    <div className="financial-icon">✅</div>
                                    <div className="financial-details">
                                        <div className="financial-label">Total Paid</div>
                                        <div className="financial-amount">${financialInfo.totalPaid.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="financial-card warning">
                                    <div className="financial-icon">⚠️</div>
                                    <div className="financial-details">
                                        <div className="financial-label">Outstanding Balance</div>
                                        <div className="financial-amount">${financialInfo.outstandingBalance.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                            {financialInfo.recentInvoices && financialInfo.recentInvoices.length > 0 && (
                                <div className="recent-invoices">
                                    <h4>Recent Invoices</h4>
                                    <table className="invoices-table-mini">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {financialInfo.recentInvoices.map(invoice => (
                                                <tr key={invoice.id}>
                                                    <td>{formatDate(invoice.created_at)}</td>
                                                    <td>{invoice.description || 'Medical Services'}</td>
                                                    <td>${invoice.amount.toFixed(2)}</td>
                                                    <td className={invoice.status === 'paid' ? 'paid' : 'pending'}>
                                                        {invoice.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                    <div className="content-panel">
                        <div className="info-section">
                            <h3>Contact Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Email Address</label>
                                    <span>{patientInfo.email}</span>
                                </div>
                                <div className="info-item">
                                    <label>Phone Number</label>
                                    <span>{patientInfo.phoneNumber}</span>
                                </div>
                                <div className="info-item">
                                    <label>Address</label>
                                    <span>{patientInfo.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;