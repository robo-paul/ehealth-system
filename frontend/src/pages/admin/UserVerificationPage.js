// frontend/src/pages/admin/UserVerificationPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './AdminPages.css';

const UserVerificationPage = () => {
    const { showSuccess, showError } = useToast();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [roles, setRoles] = useState([]);
    const [filters, setFilters] = useState({ role: '', verification_status: '' });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.verification_status) params.append('verification_status', filters.verification_status);
            
            const response = await api.get(`/master-admin/users?${params}`);
            setAllUsers(response.data);
            setPendingUsers(response.data.filter(u => u.verification_status === 'pending'));
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
            setSelectedUser(null);
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

    const handleRejectUser = async (userId) => {
        if (!rejectionReason) {
            showError('Please provide a rejection reason');
            return;
        }
        
        try {
            await api.post(`/master-admin/users/${userId}/reject`, { rejectionReason });
            showSuccess('User verification rejected');
            fetchUsers();
            setSelectedUser(null);
            setRejectionReason('');
        } catch (error) {
            showError('Failed to reject user');
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

    const getRoleDisplayName = (role) => {
        if (!role) return 'N/A';
        return role.replace(/_/g, ' ').toUpperCase();
    };

    const displayUsers = activeTab === 'pending' ? pendingUsers : allUsers;

    if (loading) return <div className="loading">Loading users...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>User Verification</h1>
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({pendingUsers.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Users
                    </button>
                </div>
                <div className="filters">
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.name}>
                                {getRoleDisplayName(role.name)}
                            </option>
                        ))}
                    </select>
                    {activeTab === 'all' && (
                        <select
                            value={filters.verification_status}
                            onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="users-table-container">
                {displayUsers.length === 0 ? (
                    <div className="empty-state">
                        <p>No users to display</p>
                    </div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Current Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>{user.email || '-'}</td>
                                    <td>{getRoleDisplayName(user.role)}</td>
                                    <td>{getVerificationBadge(user.verification_status)}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="actions">
                                        {user.verification_status === 'pending' && (
                                            <>
                                                <button 
                                                    className="btn-small btn-success"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setSelectedRole(user.role);
                                                    }}
                                                >
                                                    Verify
                                                </button>
                                                <button 
                                                    className="btn-small btn-danger"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setRejectionReason('');
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {user.verification_status === 'approved' && user.role !== 'master_admin' && (
                                            <button 
                                                className="btn-small btn-primary"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSelectedRole(user.role);
                                                }}
                                            >
                                                Change Role
                                            </button>
                                        )}
                                        {user.role !== 'master_admin' && (
                                            <button 
                                                className="btn-small btn-danger"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Verify Modal */}
            {selectedUser && selectedUser.verification_status === 'pending' && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Verify User</h3>
                        <p>User: <strong>{selectedUser.username}</strong></p>
                        <p>Current Role: <strong>{getRoleDisplayName(selectedUser.role)}</strong></p>
                        
                        <div className="form-group">
                            <label>Assign Role</label>
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>
                                        {getRoleDisplayName(role.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn-success"
                                onClick={() => handleVerifyUser(selectedUser.id, selectedRole)}
                            >
                                Verify User
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

            {/* Reject Modal */}
            {selectedUser && selectedUser.verification_status === 'pending' && rejectionReason !== undefined && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Reject Verification</h3>
                        <p>User: <strong>{selectedUser.username}</strong></p>
                        
                        <div className="form-group">
                            <label>Rejection Reason *</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows="4"
                                placeholder="Please provide a reason for rejection..."
                                required
                            />
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn-danger"
                                onClick={() => handleRejectUser(selectedUser.id)}
                            >
                                Confirm Rejection
                            </button>
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedUser(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Role Modal */}
            {selectedUser && selectedUser.verification_status === 'approved' && selectedUser.role !== 'master_admin' && (
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
                                        {getRoleDisplayName(role.name)}
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

export default UserVerificationPage;