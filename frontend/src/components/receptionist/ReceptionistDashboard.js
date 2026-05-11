// src/components/receptionist/ReceptionistDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './ReceptionistDashboard.css';

const ReceptionistDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        contactNumber: '',
        emergencyContact: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        address: ''
    });
    const [appointmentData, setAppointmentData] = useState({
        patientId: '',
        doctorId: '',
        title: '',
        description: '',
        appointmentDate: '',
        appointmentTime: '',
        duration: 30
    });
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayAppointments: 0,
        upcomingAppointments: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch patients
            const patientsRes = await api.get('/patients');
            setPatients(patientsRes.data || []);
            setStats(prev => ({ ...prev, totalPatients: patientsRes.data?.length || 0 }));
            
            // Fetch doctors
            const doctorsRes = await api.get('/doctors');
            setDoctors(doctorsRes.data || []);
            
            // Fetch appointments - use sync endpoint
            const appointmentsRes = await api.get('/appointments/sync');
            setAppointments(appointmentsRes.data || []);
            
            // Calculate today's appointments
            const today = new Date().toISOString().split('T')[0];
            const todayApps = appointmentsRes.data?.filter(a => a.appointment_date === today) || [];
            setStats(prev => ({ 
                ...prev, 
                todayAppointments: todayApps.length,
                upcomingAppointments: appointmentsRes.data?.length || 0
            }));
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPatients = patients.filter(patient =>
        patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.full_name && patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.health_record_id && patient.health_record_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredAppointments = appointments.filter(appointment =>
        appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRegisterPatient = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (formData.password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post('/patients/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                healthRecordId: `HR-${Date.now()}`,
                patientDetails: {
                    fullName: formData.fullName,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    phoneNumber: formData.contactNumber,
                    address: formData.address,
                    emergencyContact: formData.emergencyContact
                }
            });
            showSuccess(`Patient ${formData.username} registered successfully`);
            setShowRegisterForm(false);
            setFormData({
                username: '', email: '', password: '', confirmPassword: '',
                contactNumber: '', emergencyContact: '', fullName: '', dateOfBirth: '', gender: '', address: ''
            });
            fetchData();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to register patient');
        } finally {
            setSubmitting(false);
        }
    };

    const handleScheduleAppointment = async (e) => {
        e.preventDefault();
        
        if (!appointmentData.patientId || !appointmentData.doctorId || !appointmentData.appointmentDate || !appointmentData.appointmentTime) {
            showError('Please fill in all required fields');
            return;
        }
        
        setSubmitting(true);
        try {
            // Send patient_id and doctor_id for receptionist booking
            await api.post('/appointments', {
                patient_id: parseInt(appointmentData.patientId),
                doctor_id: parseInt(appointmentData.doctorId),
                title: appointmentData.title || 'General Checkup',
                description: appointmentData.description,
                appointment_date: appointmentData.appointmentDate,
                appointment_time: appointmentData.appointmentTime,
                duration: appointmentData.duration
            });
            showSuccess('Appointment scheduled successfully');
            setShowAppointmentForm(false);
            setAppointmentData({
                patientId: '', doctorId: '', title: '', description: '',
                appointmentDate: '', appointmentTime: '', duration: 30
            });
            fetchData();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to schedule appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await api.delete(`/appointments/${appointmentId}`);
                showSuccess('Appointment cancelled successfully');
                fetchData();
            } catch (error) {
                showError('Failed to cancel appointment');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'scheduled':
                return <span className="status-badge scheduled">📅 Scheduled</span>;
            case 'completed':
                return <span className="status-badge completed">✓ Completed</span>;
            case 'cancelled':
                return <span className="status-badge cancelled">✗ Cancelled</span>;
            default:
                return <span className="status-badge scheduled">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="receptionist-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, {user?.username || 'Receptionist'}</h1>
                    <p>Manage patients, schedule appointments, and handle registrations</p>
                </div>
                <div className="header-actions">
                    <button type="button" className="btn-primary" onClick={() => setShowRegisterForm(true)}>
                        + Register New Patient
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAppointmentForm(true)}>
                        📅 Schedule Appointment
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalPatients}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.todayAppointments}</div>
                        <div className="stat-label">Today's Appointments</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.upcomingAppointments}</div>
                        <div className="stat-label">Total Appointments</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search patients or appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Appointments Section */}
            <div className="appointments-section">
                <h2>Recent Appointments</h2>
                <div className="appointments-table-container">
                    {filteredAppointments.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📅</div>
                            <h3>No Appointments Found</h3>
                            <p>{searchTerm ? 'No appointments match your search.' : 'No appointments scheduled yet.'}</p>
                            <button type="button" className="btn-primary" onClick={() => setShowAppointmentForm(true)}>
                                + Schedule First Appointment
                            </button>
                        </div>
                    ) : (
                        <table className="appointments-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.slice(0, 10).map(appointment => (
                                    <tr key={appointment.id}>
                                        <td>
                                            <div className="appointment-datetime">
                                                <strong>{new Date(appointment.appointment_date).toLocaleDateString()}</strong>
                                                <span>{appointment.appointment_time}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="patient-info-cell">
                                                <span className="patient-name">{appointment.patient_name}</span>
                                                <span className="patient-id-small">ID: {appointment.patient_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="doctor-info-cell">
                                                <span>Dr. {appointment.doctor_name}</span>
                                            </div>
                                        </td>
                                        <td>{appointment.title || 'General Checkup'}</td>
                                        <td>{getStatusBadge(appointment.status)}</td>
                                        <td>
                                            {appointment.status === 'scheduled' && (
                                                <button 
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Patients Section */}
            <div className="patients-section">
                <h2>Registered Patients</h2>
                <div className="patients-table-container">
                    {filteredPatients.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <h3>No Patients Found</h3>
                            <p>{searchTerm ? 'No patients match your search.' : 'No patients registered yet.'}</p>
                            <button type="button" className="btn-primary" onClick={() => setShowRegisterForm(true)}>
                                + Register First Patient
                            </button>
                        </div>
                    ) : (
                        <table className="patients-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Username</th>
                                    <th>Contact</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.slice(0, 20).map(patient => (
                                    <tr key={patient.id}>
                                        <td>{patient.id}</td>
                                        <td>
                                            <strong>{patient.full_name || patient.username}</strong>
                                        </td>
                                        <td>@{patient.username}</td>
                                        <td>{patient.contact_number || '-'}</td>
                                        <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                type="button"
                                                className="btn-view"
                                                onClick={() => window.location.href = `/patients/${patient.id}`}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Register Patient Modal */}
            {showRegisterForm && (
                <div className="modal-overlay" onClick={() => setShowRegisterForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowRegisterForm(false)}>×</button>
                        <h3>Register New Patient</h3>
                        <form onSubmit={handleRegisterPatient}>
                            <div className="form-section">
                                <h4>Account Information</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Username *</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Password *</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password *</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Personal Information</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="tel"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact</label>
                                    <input
                                        type="tel"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Registering...' : 'Register Patient'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowRegisterForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Schedule Appointment Modal */}
            {showAppointmentForm && (
                <div className="modal-overlay" onClick={() => setShowAppointmentForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowAppointmentForm(false)}>×</button>
                        <h3>Schedule Appointment</h3>
                        <form onSubmit={handleScheduleAppointment}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Select Patient *</label>
                                    <select
                                        value={appointmentData.patientId}
                                        onChange={(e) => setAppointmentData({...appointmentData, patientId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map(patient => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.full_name || patient.username} - {patient.health_record_id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Select Doctor *</label>
                                    <select
                                        value={appointmentData.doctorId}
                                        onChange={(e) => setAppointmentData({...appointmentData, doctorId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Doctor</option>
                                        {doctors.map(doctor => (
                                            <option key={doctor.id} value={doctor.id}>
                                                Dr. {doctor.username}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Appointment Title</label>
                                <input
                                    type="text"
                                    value={appointmentData.title}
                                    onChange={(e) => setAppointmentData({...appointmentData, title: e.target.value})}
                                    placeholder="e.g., General Checkup, Follow-up"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        value={appointmentData.appointmentDate}
                                        onChange={(e) => setAppointmentData({...appointmentData, appointmentDate: e.target.value})}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Time *</label>
                                    <input
                                        type="time"
                                        value={appointmentData.appointmentTime}
                                        onChange={(e) => setAppointmentData({...appointmentData, appointmentTime: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <select
                                        value={appointmentData.duration}
                                        onChange={(e) => setAppointmentData({...appointmentData, duration: parseInt(e.target.value)})}
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">60 minutes</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description / Reason</label>
                                <textarea
                                    value={appointmentData.description}
                                    onChange={(e) => setAppointmentData({...appointmentData, description: e.target.value})}
                                    rows="3"
                                    placeholder="Brief description of symptoms or reason for visit..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Scheduling...' : 'Schedule Appointment'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowAppointmentForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistDashboard;