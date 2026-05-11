// src/pages/admin/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './AdminPages.css';

const UserManagementPage = () => {
    const { showSuccess, showError } = useToast();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [filters, setFilters] = useState({ role: '', verification_status: '' });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.verification_status) params.append('verification_status', filters.verification_status);
            
            const response = await api.get(`/master-admin/users?${params}`);
            setUsers(response.data);
        } catch (error) {
            showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [filters, showError]);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const handleVerifyUser = async (userId, role) => {
        try {
            await api.put(`/master-admin/users/${userId}/verify`, { role });
            showSuccess('User verified successfully');
            fetchUsers();
        } catch (error) {
            showError('Failed to verify user');
        }
    };

    const handleUpdateRole = async (userId, role) => {
        try {
            await api.put(`/master-admin/users/${userId}/role`, { role });
            showSuccess('User role updated successfully');
            fetchUsers();
            setSelectedUser(null);
        } catch (error) {
            showError('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await api.delete(`/master-admin/users/${userId}`);
                showSuccess('User deleted successfully');
                fetchUsers();
            } catch (error) {
                showError('Failed to delete user');
            }
        }
    };

    const getVerificationBadge = (status) => {
        switch(status) {
            case 'approved':
                return <span className="badge-success">Verified</span>;
            case 'pending':
                return <span className="badge-warning">Pending</span>;
            case 'rejected':
                return <span className="badge-danger">Rejected</span>;
            default:
                return <span className="badge-secondary">{status}</span>;
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>User Management</h1>
                <div className="filters">
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.name}>
                                {role.name.replace('_', ' ').toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.verification_status}
                        onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verification Status</th>
                            <th>Verified By</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role?.replace('_', ' ').toUpperCase()}</td>
                                <td>{getVerificationBadge(user.verification_status)}</td>
                                <td>{user.verified_by_username || '-'}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="actions">
                                    {user.verification_status === 'pending' && (
                                        <button 
                                            className="btn-small btn-success"
                                            onClick={() => handleVerifyUser(user.id, user.role)}
                                        >
                                            Verify
                                        </button>
                                    )}
                                    <button 
                                        className="btn-small btn-primary"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setSelectedRole(user.role);
                                        }}
                                    >
                                        Change Role
                                    </button>
                                    <button 
                                        className="btn-small btn-danger"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Change Role Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Change Role for {selectedUser.username}</h3>
                        <div className="form-group">
                            <label>Select New Role</label>
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>
                                        {role.name.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-primary"
                                onClick={() => handleUpdateRole(selectedUser.id, selectedRole)}
                            >
                                Update Role
                            </button>
                            <button 
                                className="btn-secondary"
                                onClick={() => setSelectedUser(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;