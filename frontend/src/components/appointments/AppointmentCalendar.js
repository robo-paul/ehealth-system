// src/components/appointments/AppointmentCalendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api'; // Use api instead of fetch
import LoadingSpinner from '../common/LoadingSpinner';
import './AppointmentCalendar.css';

const AppointmentCalendar = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        duration: 30,
        doctor_id: ''
    });

    const isPatient = user?.role === 'patient';
    const isDoctor = user?.role === 'doctor';

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/appointments/sync');
            setAppointments(response.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            showError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchDoctors = useCallback(async () => {
        try {
            console.log('Fetching doctors...');
            const response = await api.get('/doctors');
            console.log('Doctors response:', response.data);
            setDoctors(response.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
        if (isPatient) {
            fetchDoctors();
        }
    }, [fetchAppointments, fetchDoctors, isPatient]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isPatient && !formData.doctor_id) {
            showError('Please select a doctor');
            return;
        }
        
        try {
            const appointmentPayload = {
                title: formData.title || 'General Checkup',
                description: formData.description,
                appointment_date: formData.appointment_date,
                appointment_time: formData.appointment_time,
                duration: parseInt(formData.duration),
                doctor_id: parseInt(formData.doctor_id)
            };
            
            await api.post('/appointments', appointmentPayload);
            showSuccess('Appointment scheduled successfully');
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                appointment_date: new Date().toISOString().split('T')[0],
                appointment_time: '09:00',
                duration: 30,
                doctor_id: ''
            });
            fetchAppointments();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to schedule appointment');
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await api.delete(`/appointments/${id}`);
                showSuccess('Appointment cancelled');
                fetchAppointments();
            } catch (error) {
                showError('Failed to cancel appointment');
            }
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'scheduled': return 'status-scheduled';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const filteredAppointments = appointments.filter(apt => apt.appointment_date === selectedDate);

    if (loading) return <LoadingSpinner text="Loading appointments..." />;

    return (
        <div className="appointment-calendar">
            <div className="calendar-header">
                <h2>{isPatient ? 'My Appointments' : isDoctor ? 'My Schedule' : 'Appointment Calendar'}</h2>
                {isPatient && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ New Appointment'}
                    </button>
                )}
            </div>

            <div className="date-selector">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                />
            </div>

            {showForm && isPatient && (
                <div className="appointment-form">
                    <h3>Schedule New Appointment</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Select Doctor *</label>
                            <select
                                name="doctor_id"
                                value={formData.doctor_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a doctor</option>
                                {doctors.length === 0 ? (
                                    <option disabled>No doctors available</option>
                                ) : (
                                    doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.username}
                                        </option>
                                    ))
                                )}
                            </select>
                            {doctors.length === 0 && (
                                <p className="hint-text">No doctors available. Please contact reception.</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., General Checkup"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Reason for visit..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    name="appointment_date"
                                    value={formData.appointment_date}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    name="appointment_time"
                                    value={formData.appointment_time}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Duration (min)</label>
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                >
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-success">
                            Schedule Appointment
                        </button>
                    </form>
                </div>
            )}

            <div className="appointments-list">
                <h3>Appointments for {new Date(selectedDate).toLocaleDateString()}</h3>
                {filteredAppointments.length === 0 ? (
                    <p className="no-appointments">No appointments scheduled for this date</p>
                ) : (
                    filteredAppointments
                        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                        .map(appointment => (
                            <div key={appointment.id} className={`appointment-card ${getStatusClass(appointment.status)}`}>
                                <div className="appointment-time">
                                    {appointment.appointment_time}
                                </div>
                                <div className="appointment-details">
                                    <h4>{appointment.title || 'General Checkup'}</h4>
                                    <p>{appointment.description}</p>
                                    {isPatient && appointment.doctor_name && (
                                        <p className="doctor-name">👨‍⚕️ Dr. {appointment.doctor_name}</p>
                                    )}
                                    {isDoctor && appointment.patient_name && (
                                        <p className="patient-name">👤 Patient: {appointment.patient_name}</p>
                                    )}
                                    {!isPatient && !isDoctor && (
                                        <>
                                            <p className="doctor-name">👨‍⚕️ Dr. {appointment.doctor_name}</p>
                                            <p className="patient-name">👤 Patient: {appointment.patient_name}</p>
                                        </>
                                    )}
                                    <p className="appointment-meta">
                                        Duration: {appointment.duration} min | 
                                        Status: <span className={`status-text ${appointment.status}`}>{appointment.status}</span>
                                    </p>
                                </div>
                                {appointment.status === 'scheduled' && (
                                    <button 
                                        className="btn-cancel"
                                        onClick={() => handleCancel(appointment.id)}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        ))
                )}
            </div>
        </div>
    );
};

export default AppointmentCalendar;