// frontend/src/components/patients/AddPatientForm.js
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import patientService from '../../services/patientService';
import './AddPatientForm.css';

const AddPatientForm = ({ onPatientAdded, onCancel }) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        healthRecordId: '',
        patientDetails: {
            fullName: '',
            dateOfBirth: '',
            gender: '',
            phoneNumber: '',
            address: '',
            emergencyContact: '',
            bloodType: '',
            allergies: ''
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name in formData.patientDetails) {
            setFormData({
                ...formData,
                patientDetails: {
                    ...formData.patientDetails,
                    [name]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (formData.password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);
        try {
            const result = await patientService.registerPatient({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                healthRecordId: formData.healthRecordId,
                patientDetails: formData.patientDetails
            });
            
            if (result.success) {
                showSuccess(`Patient ${formData.username} registered successfully!`);
                if (onPatientAdded) onPatientAdded(result);
                // Reset form
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    healthRecordId: '',
                    patientDetails: {
                        fullName: '',
                        dateOfBirth: '',
                        gender: '',
                        phoneNumber: '',
                        address: '',
                        emergencyContact: '',
                        bloodType: '',
                        allergies: ''
                    }
                });
            }
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-patient-form">
            <div className="form-header">
                <h3>Register New Patient</h3>
                <button type="button" className="close-btn" onClick={onCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h4>Account Information</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="patient@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Minimum 6 characters"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Health Record ID (Optional)</label>
                        <input
                            type="text"
                            name="healthRecordId"
                            value={formData.healthRecordId}
                            onChange={handleChange}
                            placeholder="Auto-generated if left blank"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h4>Personal Information</h4>
                    
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.patientDetails.fullName}
                            onChange={handleChange}
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.patientDetails.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.patientDetails.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.patientDetails.phoneNumber}
                            onChange={handleChange}
                            placeholder="Contact number"
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            name="address"
                            value={formData.patientDetails.address}
                            onChange={handleChange}
                            placeholder="Full address"
                            rows="2"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Emergency Contact</label>
                            <input
                                type="tel"
                                name="emergencyContact"
                                value={formData.patientDetails.emergencyContact}
                                onChange={handleChange}
                                placeholder="Emergency phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label>Blood Type</label>
                            <select
                                name="bloodType"
                                value={formData.patientDetails.bloodType}
                                onChange={handleChange}
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
                        <label>Allergies</label>
                        <textarea
                            name="allergies"
                            value={formData.patientDetails.allergies}
                            onChange={handleChange}
                            placeholder="Any known allergies"
                            rows="2"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-get-started" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Registering...
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">🚀</span>
                                Get Started
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPatientForm;