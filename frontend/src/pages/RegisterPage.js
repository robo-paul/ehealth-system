// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSensor } from '../hooks/useSensor';
import './RegisterPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        healthRecordId: '',
        requestedRole: 'patient',
        roleRequestReason: ''
    });
    const [errors, setErrors] = useState({});
    
    const { register, loading } = useAuth();
    const { status: sensorStatus } = useSensor();

    // Available roles for request (excluding master_admin)
    const availableRoles = [
        { value: 'patient', label: 'Patient - Regular patient access', requiresApproval: false },
        { value: 'doctor', label: 'Doctor - Manage patient records and prescriptions', requiresApproval: true },
        { value: 'nurse', label: 'Nurse - Manage admissions and patient care', requiresApproval: true },
        { value: 'receptionist', label: 'Receptionist - Register patients and manage appointments', requiresApproval: true },
        { value: 'pharmacist', label: 'Pharmacist - Manage prescriptions and inventory', requiresApproval: true },
        { value: 'lab_technician', label: 'Lab Technician - Perform lab tests', requiresApproval: true },
        { value: 'radiologist', label: 'Radiologist - Perform imaging studies', requiresApproval: true },
        { value: 'billing_officer', label: 'Billing Officer - Manage invoices and payments', requiresApproval: true },
        { value: 'ict_admin', label: 'ICT Admin - Manage system settings', requiresApproval: true }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (formData.requestedRole !== 'patient' && !formData.roleRequestReason) {
            newErrors.roleRequestReason = 'Please provide a reason for requesting this role';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const result = await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            healthRecordId: formData.healthRecordId || `HR-${Date.now()}`,
            requestedRole: formData.requestedRole,
            roleRequestReason: formData.roleRequestReason
        });

        if (result.success) {
            if (result.requiresVerification) {
                navigate('/login?registered=true&pending=true');
            } else {
                navigate('/login?registered=true');
            }
        }
    };

    const selectedRole = availableRoles.find(r => r.value === formData.requestedRole);
    const requiresApproval = selectedRole?.requiresApproval || false;

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Create Account</h2>
                
                {sensorStatus.connected && (
                    <div className="sensor-notice">
                        <span className="notice-icon">🔔</span>
                        You can register your fingerprint after account creation
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                            className={errors.username ? 'error' : ''}
                            autoComplete="username"
                        />
                        {errors.username && (
                            <span className="error-text">{errors.username}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            className={errors.email ? 'error' : ''}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <span className="error-text">{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            className={errors.password ? 'error' : ''}
                            autoComplete="new-password"
                        />
                        {errors.password && (
                            <span className="error-text">{errors.password}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                            className={errors.confirmPassword ? 'error' : ''}
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && (
                            <span className="error-text">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="healthRecordId">Health Record ID</label>
                        <input
                            type="text"
                            id="healthRecordId"
                            name="healthRecordId"
                            value={formData.healthRecordId}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Auto-generated if empty"
                            autoComplete="off"
                        />
                    </div>

                    {/* Role Selection */}
                    <div className="form-group">
                        <label htmlFor="requestedRole">Requested Role *</label>
                        <select
                            id="requestedRole"
                            name="requestedRole"
                            value={formData.requestedRole}
                            onChange={handleChange}
                            disabled={loading}
                            className={errors.requestedRole ? 'error' : ''}
                        >
                            {availableRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        {requiresApproval && (
                            <div className="role-approval-note">
                                <span className="note-icon">⏳</span>
                                This role requires admin approval. You will be registered as a patient until approved.
                            </div>
                        )}
                        {errors.requestedRole && (
                            <span className="error-text">{errors.requestedRole}</span>
                        )}
                    </div>

                    {/* Role Request Reason - shown for roles requiring approval */}
                    {requiresApproval && (
                        <div className="form-group">
                            <label htmlFor="roleRequestReason">Reason for Role Request *</label>
                            <textarea
                                id="roleRequestReason"
                                name="roleRequestReason"
                                value={formData.roleRequestReason}
                                onChange={handleChange}
                                disabled={loading}
                                rows="3"
                                placeholder="Please explain why you need this role..."
                                className={errors.roleRequestReason ? 'error' : ''}
                            />
                            {errors.roleRequestReason && (
                                <span className="error-text">{errors.roleRequestReason}</span>
                            )}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Already have an account? <a href="/login">Login here</a></p>
                    <p><a href="/">Back to Home</a></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;