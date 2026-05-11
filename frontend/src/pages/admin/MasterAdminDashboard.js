// frontend/src/pages/admin/MasterAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './AdminPages.css';

const MasterAdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { isRole } = useRole();
    const { showSuccess, showError } = useToast();
    
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    
    // Modal state
    const [modalState, setModalState] = useState({
        type: null,
        isOpen: false,
        user: null,
        role: '',
        reason: ''
    });

    // Set active tab based on URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'overview') {
            setActiveTab('overview');
        } else if (tab === 'requests') {
            setActiveTab('requests');
        } else if (tab === 'roles') {
            setActiveTab('roles');
        } else if (tab === 'verifications') {
            setActiveTab('verifications');
        } else {
            setActiveTab('users');
        }
    }, [location]);

    // Check if user is master admin
    useEffect(() => {
        if (!isRole('master_admin')) {
            navigate('/dashboard');
        }
    }, [isRole, navigate]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        // Declare variables to hold responses
        let usersData = [];
        let rolesData = [];
        
        try {
            console.log('Fetching dashboard data...');
            
            // Fetch ALL users (not just patients)
            const usersRes = await api.get('/master-admin/users');
            console.log('All users response:', usersRes.data);
            usersData = usersRes.data || [];
            setUsers(usersData);
            
            // Fetch roles
            try {
                const rolesRes = await api.get('/roles');
                console.log('Roles response:', rolesRes.data);
                rolesData = rolesRes.data || [];
                setRoles(rolesData);
            } catch (roleErr) {
                console.error('Error fetching roles:', roleErr);
                setRoles([]);
            }
            
            // Fetch statistics
            try {
                const statsRes = await api.get('/master-admin/statistics');
                console.log('Stats response:', statsRes.data);
                setStats(statsRes.data);
            } catch (statsErr) {
                console.error('Error fetching stats:', statsErr);
                // Calculate stats from users array (using usersData)
                const totalUsers = usersData.length;
                const pendingVerification = usersData.filter(u => u.verification_status === 'pending').length;
                const roleDistribution = {};
                usersData.forEach(u => {
                    roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
                });
                const distributionArray = Object.entries(roleDistribution).map(([role, count]) => ({ role, count }));
                
                setStats({
                    totalUsers: { count: totalUsers },
                    pendingVerification: { count: pendingVerification },
                    pendingRequests: { count: 0 },
                    totalRoles: { count: rolesData.length },
                    roleDistribution: distributionArray
                });
            }
            
            // Fetch pending role requests
            try {
                const requestsRes = await api.get('/master-admin/role-requests/pending');
                console.log('Requests response:', requestsRes.data);
                setPendingRequests(requestsRes.data || []);
            } catch (reqErr) {
                console.error('Error fetching requests:', reqErr);
                setPendingRequests([]);
            }
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.response?.data?.error || 'Failed to load dashboard data');
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Filter users by role and verification status
    const filteredUsers = users.filter(u => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (verificationFilter !== 'all' && u.verification_status !== verificationFilter) return false;
        return true;
    });

    // Separate users by verification status for the Verifications tab
    const pendingUsers = users.filter(u => u.verification_status === 'pending');
    const verifiedUsers = users.filter(u => u.verification_status === 'approved');

    const closeModal = () => {
        setModalState({
            type: null,
            isOpen: false,
            user: null,
            role: '',
            reason: ''
        });
    };

    const openVerifyModal = (user) => {
        setModalState({
            type: 'verify',
            isOpen: true,
            user: user,
            role: user.role,
            reason: ''
        });
    };

    const openRejectModal = (user) => {
        setModalState({
            type: 'reject',
            isOpen: true,
            user: user,
            role: '',
            reason: ''
        });
    };

    const openRoleModal = (user) => {
        setModalState({
            type: 'role',
            isOpen: true,
            user: user,
            role: user.role,
            reason: ''
        });
    };

    const openDeleteModal = (user) => {
        setModalState({
            type: 'delete',
            isOpen: true,
            user: user,
            role: '',
            reason: ''
        });
    };

    const handleApproveRequest = async (requestId) => {
        try {
            await api.post(`/master-admin/role-requests/${requestId}/approve`);
            showSuccess('Role request approved successfully');
            fetchDashboardData();
        } catch (error) {
            console.error('Error approving request:', error);
            showError(error.response?.data?.error || 'Failed to approve request');
        }
    };

    const handleRejectRequest = async () => {
        if (!modalState.reason) {
            showError('Please provide a rejection reason');
            return;
        }
        try {
            await api.post(`/master-admin/role-requests/${modalState.user.id}/reject`, { 
                rejectionReason: modalState.reason 
            });
            showSuccess('Role request rejected');
            fetchDashboardData();
            closeModal();
        } catch (error) {
            console.error('Error rejecting request:', error);
            showError('Failed to reject request');
        }
    };

    const handleVerifyUser = async () => {
        if (!modalState.user || !modalState.role) {
            showError('Please select a role for the user');
            return;
        }
        try {
            await api.put(`/master-admin/users/${modalState.user.id}/verify`, { 
                role: modalState.role 
            });
            showSuccess(`User "${modalState.user.username}" verified successfully as ${getRoleDisplayName(modalState.role)}`);
            fetchDashboardData();
            closeModal();
        } catch (error) {
            console.error('Error verifying user:', error);
            showError(error.response?.data?.error || 'Failed to verify user');
        }
    };

    const handleUpdateRole = async () => {
        if (!modalState.user || !modalState.role) {
            showError('Please select a role');
            return;
        }
        try {
            await api.put(`/master-admin/users/${modalState.user.id}/role`, { 
                role: modalState.role 
            });
            showSuccess(`User "${modalState.user.username}" role updated to ${getRoleDisplayName(modalState.role)}`);
            fetchDashboardData();
            closeModal();
        } catch (error) {
            console.error('Error updating role:', error);
            showError(error.response?.data?.error || 'Failed to update user role');
        }
    };

    const handleDeleteUser = async () => {
        if (modalState.user?.role === 'master_admin') {
            showError('Cannot delete the Master Admin account');
            closeModal();
            return;
        }
        
        try {
            await api.delete(`/master-admin/users/${modalState.user.id}`);
            showSuccess(`User "${modalState.user.username}" deleted successfully`);
            fetchDashboardData();
            closeModal();
        } catch (error) {
            console.error('Error deleting user:', error);
            showError(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const getRoleDisplayName = (role) => {
        if (!role) return 'N/A';
        const roleMap = {
            'master_admin': 'Master Admin',
            'doctor': 'Doctor',
            'nurse': 'Nurse',
            'patient': 'Patient',
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
        return roleMap[role] || role.replace(/_/g, ' ').toUpperCase();
    };

    const getVerificationBadge = (status) => {
        switch(status) {
            case 'approved':
                return <span className="badge-success">✓ Verified</span>;
            case 'pending':
                return <span className="badge-warning">⏳ Pending Verification</span>;
            case 'rejected':
                return <span className="badge-danger">✗ Rejected</span>;
            default:
                return <span className="badge-secondary">{status || 'N/A'}</span>;
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

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Dashboard</h3>
                <p>{error}</p>
                <button className="btn-primary" onClick={fetchDashboardData}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="master-admin-dashboard">
            <div className="dashboard-header">
                <h1>Master Admin Dashboard</h1>
                <p>Welcome back, {user?.username}</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.totalUsers?.count || users.length}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{users.filter(u => u.verification_status === 'pending').length}</div>
                            <div className="stat-label">Pending Verification</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{users.filter(u => u.verification_status === 'approved').length}</div>
                            <div className="stat-label">Verified Users</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-info">
                            <div className="stat-value">{pendingRequests.length}</div>
                            <div className="stat-label">Role Requests</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="admin-tabs">
                <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => navigate('/admin?tab=overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => navigate('/admin?tab=users')}
                >
                    👥 All Users ({users.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'verifications' ? 'active' : ''}`}
                    onClick={() => navigate('/admin?tab=verifications')}
                >
                    ✅ Verifications ({pendingUsers.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => navigate('/admin?tab=requests')}
                >
                    📝 Role Requests ({pendingRequests.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => navigate('/admin/roles')}
                >
                    🔧 Role Management
                </button>
            </div>

            {/* All Users Tab */}
            {activeTab === 'users' && (
                <div className="users-content">
                    {/* Filters */}
                    <div className="filters-section">
                        <div className="filter-group">
                            <label>Filter by Role:</label>
                            <select 
                                value={roleFilter} 
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Roles</option>
                                <option value="master_admin">Master Admin ({users.filter(u => u.role === 'master_admin').length})</option>
                                <option value="doctor">Doctor ({users.filter(u => u.role === 'doctor').length})</option>
                                <option value="nurse">Nurse ({users.filter(u => u.role === 'nurse').length})</option>
                                <option value="patient">Patient ({users.filter(u => u.role === 'patient').length})</option>
                                <option value="receptionist">Receptionist ({users.filter(u => u.role === 'receptionist').length})</option>
                                <option value="pharmacist">Pharmacist ({users.filter(u => u.role === 'pharmacist').length})</option>
                                <option value="lab_technician">Lab Technician ({users.filter(u => u.role === 'lab_technician').length})</option>
                                <option value="radiologist">Radiologist ({users.filter(u => u.role === 'radiologist').length})</option>
                                <option value="billing_officer">Billing Officer ({users.filter(u => u.role === 'billing_officer').length})</option>
                                <option value="ict_admin">ICT Admin ({users.filter(u => u.role === 'ict_admin').length})</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Filter by Status:</label>
                            <select 
                                value={verificationFilter} 
                                onChange={(e) => setVerificationFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Verified ({users.filter(u => u.verification_status === 'approved').length})</option>
                                <option value="pending">Pending ({users.filter(u => u.verification_status === 'pending').length})</option>
                            </select>
                        </div>
                    </div>

                    <div className="users-table-container">
                        {filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">👥</div>
                                <h3>No Users Found</h3>
                                <p>No users match the selected filters.</p>
                            </div>
                        ) : (
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td className="user-id">{u.id}</td>
                                            <td className="user-username">
                                                <strong>{u.username}</strong>
                                            </td>
                                            <td className="user-email">{u.email || '-'}</td>
                                            <td className="user-role">
                                                <span className={`role-badge role-${u.role}`}>
                                                    {getRoleDisplayName(u.role)}
                                                </span>
                                            </td>
                                            <td className="user-status">
                                                {getVerificationBadge(u.verification_status)}
                                            </td>
                                            <td className="user-joined">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="user-actions">
                                                <div className="action-buttons">
                                                    {u.verification_status === 'pending' && (
                                                        <button 
                                                            className="btn-icon btn-verify"
                                                            onClick={() => openVerifyModal(u)}
                                                            title="Verify User"
                                                        >
                                                            ✓ Verify
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="btn-icon btn-role"
                                                        onClick={() => openRoleModal(u)}
                                                        title="Change Role"
                                                    >
                                                        🔄 Role
                                                    </button>
                                                    {u.role !== 'master_admin' && (
                                                        <button 
                                                            className="btn-icon btn-delete"
                                                            onClick={() => openDeleteModal(u)}
                                                            title="Delete User"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
                <div className="verifications-content">
                    {/* Pending Users Section */}
                    <div className="verification-section">
                        <h3 className="section-title pending-title">
                            ⏳ Pending Verification ({pendingUsers.length})
                        </h3>
                        {pendingUsers.length === 0 ? (
                            <div className="empty-state small">
                                <p>No pending verification requests.</p>
                            </div>
                        ) : (
                            <div className="users-table-container">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Requested Role</th>
                                            <th>Registered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td><strong>{u.username}</strong></td>
                                                <td>{u.email || '-'}</td>
                                                <td>
                                                    <select 
                                                        value={u.role} 
                                                        onChange={(e) => {
                                                            const updatedUser = { ...u, role: e.target.value };
                                                            openVerifyModal(updatedUser);
                                                        }}
                                                        className="role-select"
                                                    >
                                                        {roles.filter(r => r.name !== 'master_admin').map(role => (
                                                            <option key={role.id} value={role.name}>
                                                                {getRoleDisplayName(role.name)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="btn-success"
                                                            onClick={() => openVerifyModal(u)}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button 
                                                            className="btn-danger"
                                                            onClick={() => openRejectModal(u)}
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Verified Users Section */}
                    <div className="verification-section">
                        <h3 className="section-title verified-title">
                            ✅ Verified Users ({verifiedUsers.length})
                        </h3>
                        {verifiedUsers.length === 0 ? (
                            <div className="empty-state small">
                                <p>No verified users yet.</p>
                            </div>
                        ) : (
                            <div className="users-table-container">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Verified On</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verifiedUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td><strong>{u.username}</strong></td>
                                                <td>{u.email || '-'}</td>
                                                <td>
                                                    <span className={`role-badge role-${u.role}`}>
                                                        {getRoleDisplayName(u.role)}
                                                    </span>
                                                </td>
                                                <td>{u.verified_at ? new Date(u.verified_at).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="btn-icon btn-role"
                                                            onClick={() => openRoleModal(u)}
                                                            title="Change Role"
                                                        >
                                                            🔄 Change Role
                                                        </button>
                                                        {u.role !== 'master_admin' && (
                                                            <button 
                                                                className="btn-icon btn-delete"
                                                                onClick={() => openDeleteModal(u)}
                                                                title="Delete User"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="overview-content">
                    <div className="role-distribution">
                        <h3>Role Distribution</h3>
                        <div className="distribution-list">
                            {(stats.roleDistribution || []).map(role => (
                                <div key={role.role} className="distribution-item">
                                    <span className="role-name">{getRoleDisplayName(role.role)}</span>
                                    <div className="role-count-bar">
                                        <div className="role-count-number">{role.count}</div>
                                        <div className="role-count-percent">
                                            {stats.totalUsers?.count ? ((role.count / stats.totalUsers.count) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Role Requests Tab */}
            {activeTab === 'requests' && (
                <div className="requests-content">
                    {pendingRequests.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <h3>No Pending Requests</h3>
                            <p>All role requests have been processed.</p>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {pendingRequests.map(request => (
                                <div key={request.id} className="request-card">
                                    <div className="request-header">
                                        <h3>{request.username}</h3>
                                        <span className="badge-warning">Pending</span>
                                    </div>
                                    <div className="request-details">
                                        <p><strong>Requested Role:</strong> {getRoleDisplayName(request.requested_role)}</p>
                                        <p><strong>Email:</strong> {request.email}</p>
                                        {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                                        <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="request-actions">
                                        <button 
                                            className="btn-success"
                                            onClick={() => handleApproveRequest(request.id)}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button 
                                            className="btn-danger"
                                            onClick={() => openRejectModal(request)}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Role Management Tab */}
            {activeTab === 'roles' && (
                <div className="roles-content">
                    <div className="roles-header">
                        <h3>System Roles & Permissions</h3>
                        <button 
                            className="btn-primary"
                            onClick={() => navigate('/admin/roles')}
                        >
                            + Manage Roles
                        </button>
                    </div>
                    <div className="roles-list">
                        {roles.length === 0 ? (
                            <div className="empty-state">No roles found</div>
                        ) : (
                            roles.map(role => (
                                <div key={role.id} className="role-item">
                                    <div className="role-info">
                                        <h4>{getRoleDisplayName(role.name)}</h4>
                                        <p>{role.description || 'No description available'}</p>
                                        <div className="role-meta">
                                            <span className="permissions-count">
                                                📋 {role.permissions?.length || 0} permissions
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <>
                {/* Verify User Modal */}
                {modalState.isOpen && modalState.type === 'verify' && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Verify User</h3>
                            <p>User: <strong>{modalState.user?.username}</strong></p>
                            <p>Current Status: <strong className="badge-warning">Pending Verification</strong></p>
                            <div className="form-group">
                                <label>Assign Role *</label>
                                <select 
                                    value={modalState.role}
                                    onChange={(e) => setModalState({ ...modalState, role: e.target.value })}
                                >
                                    <option value="">Select a role...</option>
                                    {roles.filter(r => r.name !== 'master_admin').map(role => (
                                        <option key={role.id} value={role.name}>
                                            {getRoleDisplayName(role.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-success" onClick={handleVerifyUser}>Verify User</button>
                                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Request Modal */}
                {modalState.isOpen && modalState.type === 'reject' && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Reject Role Request</h3>
                            <p>User: <strong>{modalState.user?.username}</strong></p>
                            <p>Requested Role: <strong>{getRoleDisplayName(modalState.user?.requested_role)}</strong></p>
                            <div className="form-group">
                                <label>Rejection Reason *</label>
                                <textarea
                                    value={modalState.reason}
                                    onChange={(e) => setModalState({ ...modalState, reason: e.target.value })}
                                    rows="4"
                                    placeholder="Please provide a reason for rejection..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn-danger" onClick={handleRejectRequest}>Confirm Rejection</button>
                                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Role Modal */}
                {modalState.isOpen && modalState.type === 'role' && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Change Role for {modalState.user?.username}</h3>
                            <div className="form-group">
                                <label>Select New Role *</label>
                                <select 
                                    value={modalState.role}
                                    onChange={(e) => setModalState({ ...modalState, role: e.target.value })}
                                >
                                    <option value="">Select a role...</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.name}>
                                            {getRoleDisplayName(role.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={handleUpdateRole}>Update Role</button>
                                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete User Modal */}
                {modalState.isOpen && modalState.type === 'delete' && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Delete User</h3>
                            <p>Are you sure you want to delete user <strong>{modalState.user?.username}</strong>?</p>
                            <p className="warning-text">⚠️ This action cannot be undone.</p>
                            <div className="modal-actions">
                                <button className="btn-danger" onClick={handleDeleteUser}>Confirm Delete</button>
                                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};

export default MasterAdminDashboard;