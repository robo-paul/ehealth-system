// frontend/src/pages/admin/RoleManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './AdminPages.css';

const RoleManagementPage = () => {
    const navigate = useNavigate();
    const { isRole } = useRole();
    const { showSuccess, showError } = useToast();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    });
    const [permissionInput, setPermissionInput] = useState('');

    // Available permissions list
    const availablePermissions = [
        // Patient permissions
        { value: 'view_own_records', label: 'View Own Records', category: 'Patient' },
        { value: 'create_own_records', label: 'Create Own Records', category: 'Patient' },
        { value: 'update_own_records', label: 'Update Own Records', category: 'Patient' },
        { value: 'view_own_appointments', label: 'View Own Appointments', category: 'Patient' },
        { value: 'create_appointments', label: 'Create Appointments', category: 'Patient' },
        { value: 'cancel_appointments', label: 'Cancel Appointments', category: 'Patient' },
        { value: 'view_own_prescriptions', label: 'View Own Prescriptions', category: 'Patient' },
        { value: 'request_refills', label: 'Request Refills', category: 'Patient' },
        { value: 'view_own_profile', label: 'View Own Profile', category: 'Patient' },
        { value: 'update_own_profile', label: 'Update Own Profile', category: 'Patient' },
        { value: 'change_own_password', label: 'Change Own Password', category: 'Patient' },
        
        // Clinical permissions
        { value: 'view_patient_records', label: 'View Patient Records', category: 'Clinical' },
        { value: 'create_patient_records', label: 'Create Patient Records', category: 'Clinical' },
        { value: 'update_patient_records', label: 'Update Patient Records', category: 'Clinical' },
        { value: 'view_all_appointments', label: 'View All Appointments', category: 'Clinical' },
        { value: 'manage_appointments', label: 'Manage Appointments', category: 'Clinical' },
        { value: 'view_patient_list', label: 'View Patient List', category: 'Clinical' },
        { value: 'create_prescriptions', label: 'Create Prescriptions', category: 'Clinical' },
        { value: 'update_prescriptions', label: 'Update Prescriptions', category: 'Clinical' },
        { value: 'view_all_prescriptions', label: 'View All Prescriptions', category: 'Clinical' },
        { value: 'update_patient_vitals', label: 'Update Patient Vitals', category: 'Clinical' },
        { value: 'assist_in_appointments', label: 'Assist in Appointments', category: 'Clinical' },
        
        // Diagnostic permissions
        { value: 'view_lab_requests', label: 'View Lab Requests', category: 'Diagnostic' },
        { value: 'update_lab_results', label: 'Update Lab Results', category: 'Diagnostic' },
        { value: 'view_imaging_requests', label: 'View Imaging Requests', category: 'Diagnostic' },
        { value: 'update_imaging_results', label: 'Update Imaging Results', category: 'Diagnostic' },
        { value: 'perform_lab_tests', label: 'Perform Lab Tests', category: 'Diagnostic' },
        { value: 'record_test_results', label: 'Record Test Results', category: 'Diagnostic' },
        { value: 'perform_imaging', label: 'Perform Imaging', category: 'Diagnostic' },
        { value: 'interpret_images', label: 'Interpret Images', category: 'Diagnostic' },
        { value: 'write_imaging_reports', label: 'Write Imaging Reports', category: 'Diagnostic' },
        
        // Therapeutic permissions
        { value: 'view_therapy_requests', label: 'View Therapy Requests', category: 'Therapeutic' },
        { value: 'create_therapy_plans', label: 'Create Therapy Plans', category: 'Therapeutic' },
        { value: 'update_therapy_plans', label: 'Update Therapy Plans', category: 'Therapeutic' },
        { value: 'schedule_therapy_sessions', label: 'Schedule Therapy Sessions', category: 'Therapeutic' },
        { value: 'record_therapy_notes', label: 'Record Therapy Notes', category: 'Therapeutic' },
        { value: 'view_therapy_history', label: 'View Therapy History', category: 'Therapeutic' },
        { value: 'create_diet_plans', label: 'Create Diet Plans', category: 'Therapeutic' },
        { value: 'update_diet_plans', label: 'Update Diet Plans', category: 'Therapeutic' },
        
        // Pharmacy permissions
        { value: 'dispense_medication', label: 'Dispense Medication', category: 'Pharmacy' },
        { value: 'update_prescription_status', label: 'Update Prescription Status', category: 'Pharmacy' },
        { value: 'manage_inventory', label: 'Manage Inventory', category: 'Pharmacy' },
        { value: 'view_patient_allergies', label: 'View Patient Allergies', category: 'Pharmacy' },
        
        // Administrative permissions
        { value: 'register_patients', label: 'Register Patients', category: 'Administrative' },
        { value: 'schedule_appointments', label: 'Schedule Appointments', category: 'Administrative' },
        { value: 'update_patient_demographics', label: 'Update Patient Demographics', category: 'Administrative' },
        { value: 'manage_payments', label: 'Manage Payments', category: 'Administrative' },
        { value: 'view_invoices', label: 'View Invoices', category: 'Administrative' },
        { value: 'create_invoices', label: 'Create Invoices', category: 'Administrative' },
        { value: 'process_payments', label: 'Process Payments', category: 'Administrative' },
        { value: 'view_insurance_claims', label: 'View Insurance Claims', category: 'Administrative' },
        { value: 'submit_claims', label: 'Submit Claims', category: 'Administrative' },
        { value: 'view_financial_reports', label: 'View Financial Reports', category: 'Administrative' },
        
        // Management permissions
        { value: 'manage_staff', label: 'Manage Staff', category: 'Management' },
        { value: 'manage_users', label: 'Manage Users', category: 'Management' },
        { value: 'manage_roles', label: 'Manage Roles', category: 'Management' },
        { value: 'view_audit_logs', label: 'View Audit Logs', category: 'Management' },
        { value: 'manage_system_settings', label: 'Manage System Settings', category: 'Management' },
        { value: 'backup_database', label: 'Backup Database', category: 'Management' },
        { value: 'restore_database', label: 'Restore Database', category: 'Management' },
        { value: 'view_all_data', label: 'View All Data', category: 'Management' },
        { value: 'view_department_stats', label: 'View Department Stats', category: 'Management' },
        { value: 'manage_department_schedules', label: 'Manage Department Schedules', category: 'Management' },
        { value: 'approve_leave_requests', label: 'Approve Leave Requests', category: 'Management' },
        { value: 'view_department_reports', label: 'View Department Reports', category: 'Management' }
    ];

    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            showError('Failed to load roles');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        // Check if user is master admin
        if (!isRole('master_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchRoles();
    }, [isRole, navigate, fetchRoles]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddPermission = () => {
        if (permissionInput && !formData.permissions.includes(permissionInput)) {
            setFormData({
                ...formData,
                permissions: [...formData.permissions, permissionInput]
            });
            setPermissionInput('');
        }
    };

    const handleRemovePermission = (permission) => {
        setFormData({
            ...formData,
            permissions: formData.permissions.filter(p => p !== permission)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            showError('Role name is required');
            return;
        }
        
        // Validate role name format (lowercase and underscores only)
        if (!/^[a-z_]+$/.test(formData.name)) {
            showError('Role name must use lowercase letters and underscores only');
            return;
        }
        
        try {
            if (editingRole) {
                await api.put(`/master-admin/roles/${editingRole.id}`, {
                    name: formData.name,
                    description: formData.description,
                    permissions: formData.permissions
                });
                showSuccess('Role updated successfully');
            } else {
                await api.post('/master-admin/roles', {
                    name: formData.name,
                    description: formData.description,
                    permissions: formData.permissions
                });
                showSuccess('Role created successfully');
            }
            setShowForm(false);
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
            setPermissionInput('');
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            showError(error.response?.data?.error || 'Failed to save role');
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || []
        });
        setPermissionInput('');
        setShowForm(true);
    };

    const handleDelete = async (roleId, roleName) => {
        if (roleName === 'master_admin') {
            showError('Cannot delete the Master Admin role');
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete the "${roleName}" role? This action cannot be undone.`)) {
            try {
                await api.delete(`/master-admin/roles/${roleId}`);
                showSuccess('Role deleted successfully');
                fetchRoles();
            } catch (error) {
                console.error('Error deleting role:', error);
                showError(error.response?.data?.error || 'Failed to delete role');
            }
        }
    };

    const getPermissionsCount = (permissions) => {
        if (!permissions || permissions.length === 0) return '0 permissions';
        return `${permissions.length} permission${permissions.length !== 1 ? 's' : ''}`;
    };

    const getRoleIcon = (roleName) => {
        const icons = {
            'master_admin': '👑',
            'patient': '👤',
            'doctor': '👨‍⚕️',
            'nurse': '👩‍⚕️',
            'diagnostic_staff': '🔬',
            'lab_technician': '🧪',
            'radiologist': '📷',
            'therapeutic_staff': '💪',
            'physiotherapist': '🦵',
            'nutritionist': '🥗',
            'pharmacist': '💊',
            'receptionist': '📋',
            'billing_officer': '💰',
            'ict_admin': '💻',
            'hr_admin': '👥',
            'department_head': '👔'
        };
        return icons[roleName] || '📁';
    };

    const getRoleClass = (roleName) => {
        const classes = {
            'master_admin': 'role-master_admin',
            'patient': 'role-patient',
            'doctor': 'role-doctor',
            'nurse': 'role-nurse',
            'diagnostic_staff': 'role-diagnostic_staff',
            'lab_technician': 'role-lab_technician',
            'radiologist': 'role-radiologist',
            'therapeutic_staff': 'role-therapeutic_staff',
            'physiotherapist': 'role-physiotherapist',
            'nutritionist': 'role-nutritionist',
            'pharmacist': 'role-pharmacist',
            'receptionist': 'role-receptionist',
            'billing_officer': 'role-billing_officer',
            'ict_admin': 'role-ict_admin',
            'hr_admin': 'role-hr_admin',
            'department_head': 'role-department_head'
        };
        return classes[roleName] || 'role-default';
    };

    const getRoleDisplayName = (roleName) => {
        const names = {
            'master_admin': 'Master Admin',
            'patient': 'Patient',
            'doctor': 'Doctor',
            'nurse': 'Nurse',
            'diagnostic_staff': 'Diagnostic Staff',
            'lab_technician': 'Lab Technician',
            'radiologist': 'Radiologist',
            'therapeutic_staff': 'Therapeutic Staff',
            'physiotherapist': 'Physiotherapist',
            'nutritionist': 'Nutritionist',
            'pharmacist': 'Pharmacist',
            'receptionist': 'Receptionist',
            'billing_officer': 'Billing Officer',
            'ict_admin': 'ICT Admin',
            'hr_admin': 'HR Admin',
            'department_head': 'Department Head'
        };
        return names[roleName] || roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading roles...</p>
            </div>
        );
    }

    return (
        <div className="role-management-page">
            <div className="page-header">
                <h1>Role Management</h1>
                <button 
                    className="btn-primary"
                    onClick={() => {
                        setEditingRole(null);
                        setFormData({ name: '', description: '', permissions: [] });
                        setPermissionInput('');
                        setShowForm(true);
                    }}
                >
                    + Add New Role
                </button>
            </div>

            {showForm && (
                <div className="role-form">
                    <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Role Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., radiologist, lab_technician"
                                pattern="[a-z_]+"
                                title="Use lowercase letters and underscores only"
                                disabled={editingRole?.name === 'master_admin'}
                            />
                            <small>Use lowercase letters and underscores (e.g., lab_technician)</small>
                        </div>
                        
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Describe the role and its responsibilities..."
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Permissions</label>
                            <div className="permission-input-group">
                                <select 
                                    value={permissionInput}
                                    onChange={(e) => setPermissionInput(e.target.value)}
                                    className="permission-select"
                                >
                                    <option value="">Select a permission...</option>
                                    {availablePermissions
                                        .filter(p => !formData.permissions.includes(p.value))
                                        .map(perm => (
                                            <option key={perm.value} value={perm.value}>
                                                {perm.label} ({perm.category})
                                            </option>
                                        ))}
                                </select>
                                <button 
                                    type="button" 
                                    onClick={handleAddPermission}
                                    className="btn-small btn-primary"
                                    disabled={!permissionInput}
                                >
                                    Add
                                </button>
                            </div>
                            
                            {formData.permissions.length > 0 && (
                                <div className="permissions-list">
                                    <strong>Selected Permissions ({formData.permissions.length}):</strong>
                                    <div className="permissions-tags">
                                        {formData.permissions.map(perm => {
                                            const permInfo = availablePermissions.find(p => p.value === perm);
                                            return (
                                                <span key={perm} className="permission-tag">
                                                    {permInfo?.label || perm.replace(/_/g, ' ').toUpperCase()}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePermission(perm)}
                                                        className="remove-permission"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="btn-success">
                                {editingRole ? 'Update Role' : 'Create Role'}
                            </button>
                            <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingRole(null);
                                    setFormData({ name: '', description: '', permissions: [] });
                                    setPermissionInput('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="roles-list">
                <h2>System Roles ({roles.length})</h2>
                {roles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚙️</div>
                        <h3>No Roles Found</h3>
                        <p>Click the "Add New Role" button to create your first role.</p>
                        <button 
                            className="btn-primary"
                            onClick={() => {
                                setEditingRole(null);
                                setFormData({ name: '', description: '', permissions: [] });
                                setPermissionInput('');
                                setShowForm(true);
                            }}
                        >
                            + Create First Role
                        </button>
                    </div>
                ) : (
                    <div className="roles-grid">
                        {roles.map(role => (
                            <div key={role.id} className="role-card">
                                <div className="role-card-header">
                                    <div className={`role-icon ${getRoleClass(role.name)}`}>
                                        {getRoleIcon(role.name)}
                                    </div>
                                    <div className="role-info">
                                        <h3>{getRoleDisplayName(role.name)}</h3>
                                        <p className="role-description">{role.description || 'No description provided'}</p>
                                    </div>
                                    {role.name === 'master_admin' && (
                                        <span className="master-badge">System</span>
                                    )}
                                </div>
                                
                                <div className="role-stats">
                                    <span className="permissions-count">
                                        📋 {getPermissionsCount(role.permissions)}
                                    </span>
                                </div>
                                
                                {role.permissions && role.permissions.length > 0 && (
                                    <div className="role-permissions-preview">
                                        <strong>Sample permissions:</strong>
                                        <div className="permission-preview-tags">
                                            {role.permissions.slice(0, 3).map(perm => {
                                                const permInfo = availablePermissions.find(p => p.value === perm);
                                                return (
                                                    <span key={perm} className="preview-tag">
                                                        {permInfo?.label?.split(' ').slice(0, 2).join(' ') || perm.split('_').slice(0, 2).join(' ')}
                                                    </span>
                                                );
                                            })}
                                            {role.permissions.length > 3 && (
                                                <span className="preview-tag more">
                                                    +{role.permissions.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="role-card-actions">
                                    <button 
                                        className="btn-small btn-primary"
                                        onClick={() => handleEdit(role)}
                                        disabled={role.name === 'master_admin'}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn-small btn-danger"
                                        onClick={() => handleDelete(role.id, role.name)}
                                        disabled={role.name === 'master_admin'}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManagementPage;