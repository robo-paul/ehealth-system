// src/components/prescriptions/PrescriptionList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import prescriptionService from '../../services/prescriptionService';
import LoadingSpinner from '../common/LoadingSpinner';
import './PrescriptionList.css';

const PrescriptionList = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [formData, setFormData] = useState({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        refills: 0,
        patient_id: ''
    });

    const fetchPrescriptions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await prescriptionService.getPrescriptions();
            setPrescriptions(data);
        } catch (error) {
            showError('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchPrescriptions();
    }, [fetchPrescriptions]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedPrescription) {
                await prescriptionService.updatePrescription(selectedPrescription.id, formData);
                showSuccess('Prescription updated successfully');
            } else {
                await prescriptionService.createPrescription(formData);
                showSuccess('Prescription created successfully');
            }
            setShowForm(false);
            setSelectedPrescription(null);
            setFormData({
                medication: '',
                dosage: '',
                frequency: '',
                duration: '',
                notes: '',
                refills: 0,
                patient_id: ''
            });
            fetchPrescriptions();
        } catch (error) {
            showError(error.message);
        }
    };

    const handleEdit = (prescription) => {
        setSelectedPrescription(prescription);
        setFormData({
            medication: prescription.medication,
            dosage: prescription.dosage,
            frequency: prescription.frequency || '',
            duration: prescription.duration || '',
            notes: prescription.notes || '',
            refills: prescription.refills || 0,
            patient_id: prescription.patient_id || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this prescription?')) {
            try {
                await prescriptionService.deletePrescription(id);
                showSuccess('Prescription deleted successfully');
                fetchPrescriptions();
            } catch (error) {
                showError('Failed to delete prescription');
            }
        }
    };

    const handleRefill = async (id) => {
        try {
            await prescriptionService.refillPrescription(id);
            showSuccess('Refill requested successfully');
            fetchPrescriptions();
        } catch (error) {
            showError('Failed to request refill');
        }
    };

    const getStatusBadge = (prescription) => {
        const now = new Date();
        const endDate = prescription.end_date ? new Date(prescription.end_date) : null;
        
        if (endDate && endDate < now) {
            return <span className="badge expired">Expired</span>;
        }
        if (prescription.refills > 0) {
            return <span className="badge active">Active</span>;
        }
        return <span className="badge pending">No Refills</span>;
    };

    if (loading) return <LoadingSpinner text="Loading prescriptions..." />;

    return (
        <div className="prescription-list">
            <div className="prescription-header">
                <h2>Prescriptions</h2>
                {user?.role === 'doctor' && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setSelectedPrescription(null);
                            setFormData({
                                medication: '',
                                dosage: '',
                                frequency: '',
                                duration: '',
                                notes: '',
                                refills: 0,
                                patient_id: ''
                            });
                            setShowForm(!showForm);
                        }}
                    >
                        {showForm ? 'Cancel' : '+ New Prescription'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="prescription-form">
                    <h3>{selectedPrescription ? 'Edit' : 'New'} Prescription</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Medication *</label>
                                <input
                                    type="text"
                                    name="medication"
                                    value={formData.medication}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Amoxicillin"
                                />
                            </div>

                            <div className="form-group">
                                <label>Dosage *</label>
                                <input
                                    type="text"
                                    name="dosage"
                                    value={formData.dosage}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 500mg"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Frequency</label>
                                <input
                                    type="text"
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Twice daily"
                                />
                            </div>

                            <div className="form-group">
                                <label>Duration</label>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 7 days"
                                />
                            </div>

                            <div className="form-group">
                                <label>Refills</label>
                                <input
                                    type="number"
                                    name="refills"
                                    value={formData.refills}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {user?.role === 'doctor' && (
                            <div className="form-group">
                                <label>Patient</label>
                                <select
                                    name="patient_id"
                                    value={formData.patient_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {/* This would be populated with patients list */}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Additional instructions..."
                            />
                        </div>

                        <button type="submit" className="btn btn-success">
                            {selectedPrescription ? 'Update' : 'Create'} Prescription
                        </button>
                    </form>
                </div>
            )}

            {prescriptions.length === 0 ? (
                <div className="no-prescriptions">
                    <p>No prescriptions found.</p>
                </div>
            ) : (
                <div className="prescriptions-grid">
                    {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="prescription-card">
                            <div className="prescription-card-header">
                                <h3>{prescription.medication}</h3>
                                {getStatusBadge(prescription)}
                            </div>
                            
                            <div className="prescription-details">
                                <p><strong>Dosage:</strong> {prescription.dosage}</p>
                                {prescription.frequency && (
                                    <p><strong>Frequency:</strong> {prescription.frequency}</p>
                                )}
                                {prescription.duration && (
                                    <p><strong>Duration:</strong> {prescription.duration}</p>
                                )}
                                <p><strong>Refills left:</strong> {prescription.refills || 0}</p>
                                {prescription.notes && (
                                    <p className="prescription-notes">{prescription.notes}</p>
                                )}
                                <p className="prescription-date">
                                    Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="prescription-actions">
                                <button 
                                    className="btn-icon" 
                                    onClick={() => handleEdit(prescription)}
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                {prescription.refills > 0 && (
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => handleRefill(prescription.id)}
                                        title="Request Refill"
                                    >
                                        🔄
                                    </button>
                                )}
                                <button 
                                    className="btn-icon delete" 
                                    onClick={() => handleDelete(prescription.id)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrescriptionList;