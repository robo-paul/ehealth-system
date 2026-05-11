// src/pages/StaffManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import './StaffManagementPage.css';

const StaffManagementPage = () => {
    const { hasPermission } = useRole();
    const { showSuccess, showError } = useToast();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: '',
        staffId: '',
        department: '',
        specialization: '',
        qualification: '',
        licenseNumber: '',
        yearsOfExperience: '',
        contactNumber: '',
        employmentDate: ''
    });

    // Wrap fetchStaff in useCallback to memoize it
    const fetchStaff = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/roles/staff/all');
            setStaff(response.data);
        } catch (error) {
            showError('Failed to load staff');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        fetchRoles();
    }, [fetchStaff, fetchRoles]); // Added dependencies

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // First create user
            const userResponse = await api.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            
            // Then create staff record
            await api.post('/roles/staff', {
                userId: userResponse.data.userId,
                staffId: formData.staffId,
                department: formData.department,
                specialization: formData.specialization,
                qualification: formData.qualification,
                licenseNumber: formData.licenseNumber,
                yearsOfExperience: formData.yearsOfExperience,
                contactNumber: formData.contactNumber,
                employmentDate: formData.employmentDate
            });
            
            showSuccess('Staff member added successfully');
            setShowForm(false);
            setFormData({
                username: '',
                email: '',
                password: '',
                role: '',
                staffId: '',
                department: '',
                specialization: '',
                qualification: '',
                licenseNumber: '',
                yearsOfExperience: '',
                contactNumber: '',
                employmentDate: ''
            });
            fetchStaff();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to add staff');
        }
    };

    const getDepartmentBadge = (department) => {
        const colors = {
            'Medical': '#3498db',
            'Diagnostic': '#9b59b6',
            'Therapeutic': '#27ae60',
            'Pharmacy': '#e74c3c',
            'Administration': '#f39c12',
            'IT': '#1abc9c',
            'HR': '#e67e22',
            'Billing': '#95a5a6'
        };
        
        return {
            backgroundColor: colors[department] || '#7f8c8d',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem'
        };
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="staff-management">
            <div className="page-header">
                <h1>Staff Management</h1>
                {hasPermission('manage_staff') && (
                    <button 
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ Add Staff Member'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="staff-form">
                    <h2>Add New Staff Member</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
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
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.name}>
                                            {role.name.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Staff ID *</label>
                                <input
                                    type="text"
                                    name="staffId"
                                    value={formData.staffId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Department *</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Diagnostic">Diagnostic</option>
                                    <option value="Therapeutic">Therapeutic</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                    <option value="Administration">Administration</option>
                                    <option value="IT">IT</option>
                                    <option value="HR">HR</option>
                                    <option value="Billing">Billing</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Specialization</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Qualification</label>
                                <input
                                    type="text"
                                    name="qualification"
                                    value={formData.qualification}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>License Number</label>
                                <input
                                    type="text"
                                    name="licenseNumber"
                                    value={formData.licenseNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    name="yearsOfExperience"
                                    value={formData.yearsOfExperience}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Employment Date</label>
                                <input
                                    type="date"
                                    name="employmentDate"
                                    value={formData.employmentDate}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-success">Create Staff Member</button>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="staff-list">
                <h2>Staff Members</h2>
                <div className="staff-grid">
                    {staff.map(member => (
                        <div key={member.id} className="staff-card">
                            <div className="staff-header">
                                <h3>{member.username}</h3>
                                <span className="staff-role">{member.role?.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="staff-details">
                                <p><strong>Staff ID:</strong> {member.staff_id || 'N/A'}</p>
                                <p><strong>Email:</strong> {member.email}</p>
                                <p><strong>Department:</strong> 
                                    <span style={getDepartmentBadge(member.department)}>
                                        {member.department || 'N/A'}
                                    </span>
                                </p>
                                {member.specialization && (
                                    <p><strong>Specialization:</strong> {member.specialization}</p>
                                )}
                                {member.qualification && (
                                    <p><strong>Qualification:</strong> {member.qualification}</p>
                                )}
                                {member.license_number && (
                                    <p><strong>License:</strong> {member.license_number}</p>
                                )}
                                <p><strong>Experience:</strong> {member.years_of_experience || 0} years</p>
                                <p><strong>Status:</strong> 
                                    <span className={`status-${member.status}`}>
                                        {member.status || 'active'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffManagementPage;