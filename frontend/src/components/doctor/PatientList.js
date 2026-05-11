// src/components/doctor/PatientList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import './DoctorDashboard.css';

const PatientList = () => {
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [prescription, setPrescription] = useState({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        refills: 0
    });

    // Wrap fetchPatients in useCallback to prevent infinite loops
    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/doctor/patients');
            setPatients(response.data);
        } catch (error) {
            showError('Failed to load patients');
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handlePrescriptionChange = (e) => {
        setPrescription({
            ...prescription,
            [e.target.name]: e.target.value
        });
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/doctor/prescriptions/${selectedPatient.id}`, prescription);
            showSuccess('Prescription created successfully');
            setSelectedPatient(null);
            setPrescription({
                medication: '',
                dosage: '',
                frequency: '',
                duration: '',
                notes: '',
                refills: 0
            });
        } catch (error) {
            showError('Failed to create prescription');
            console.error('Error creating prescription:', error);
        }
    };

    const viewPatientRecords = (patientId) => {
        window.location.href = `/patient/${patientId}/records`;
    };

    if (loading) return <LoadingSpinner text="Loading patients..." />;

    return (
        <div className="patient-list">
            <h2>My Patients</h2>
            
            {patients.length === 0 ? (
                <div className="no-patients">
                    <p>No patients assigned to you yet.</p>
                </div>
            ) : (
                <div className="patients-grid">
                    {patients.map(patient => (
                        <div key={patient.id} className="patient-card">
                            <div className="patient-header">
                                <h3>{patient.username}</h3>
                                <span className="patient-id">ID: {patient.health_record_id}</span>
                            </div>
                            <div className="patient-info">
                                <p><strong>Email:</strong> {patient.email || 'Not provided'}</p>
                                <p><strong>Member since:</strong> {new Date(patient.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="patient-actions">
                                <button 
                                    className="btn-view"
                                    onClick={() => viewPatientRecords(patient.id)}
                                >
                                    View Records
                                </button>
                                <button 
                                    className="btn-prescribe"
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    Prescribe
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPatient && (
                <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>New Prescription for {selectedPatient.username}</h3>
                        <form onSubmit={handlePrescriptionSubmit}>
                            <div className="form-group">
                                <label>Medication *</label>
                                <input
                                    type="text"
                                    name="medication"
                                    value={prescription.medication}
                                    onChange={handlePrescriptionChange}
                                    required
                                    placeholder="e.g., Amoxicillin"
                                />
                            </div>

                            <div className="form-group">
                                <label>Dosage *</label>
                                <input
                                    type="text"
                                    name="dosage"
                                    value={prescription.dosage}
                                    onChange={handlePrescriptionChange}
                                    required
                                    placeholder="e.g., 500mg"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <input
                                        type="text"
                                        name="frequency"
                                        value={prescription.frequency}
                                        onChange={handlePrescriptionChange}
                                        placeholder="e.g., Twice daily"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={prescription.duration}
                                        onChange={handlePrescriptionChange}
                                        placeholder="e.g., 7 days"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Refills</label>
                                    <input
                                        type="number"
                                        name="refills"
                                        value={prescription.refills}
                                        onChange={handlePrescriptionChange}
                                        min="0"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={prescription.notes}
                                    onChange={handlePrescriptionChange}
                                    rows="3"
                                    placeholder="Additional instructions..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Create Prescription</button>
                                <button type="button" className="btn-secondary" onClick={() => setSelectedPatient(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;