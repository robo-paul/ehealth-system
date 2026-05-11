// src/components/common/RoleBasedNav.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import PermissionGate from './PermissionGate';
import './RoleBasedNav.css';

const RoleBasedNav = () => {
    const { user, logout } = useAuth();
    const { userRole, isRole } = useRole();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getRoleIcon = () => {
        switch(userRole) {
            case 'master_admin': return '👑';
            case 'doctor': return '👨‍⚕️';
            case 'nurse': return '👩‍⚕️';
            case 'diagnostic_staff':
            case 'lab_technician': return '🔬';
            case 'radiologist': return '📷';
            case 'therapeutic_staff':
            case 'physiotherapist':
            case 'nutritionist': return '💪';
            case 'pharmacist': return '💊';
            case 'receptionist': return '📋';
            case 'billing_officer': return '💰';
            case 'ict_admin': return '💻';
            case 'hr_admin': return '👥';
            case 'department_head': return '👔';
            default: return '👤';
        }
    };

    const getRoleDisplayName = () => {
        switch(userRole) {
            case 'master_admin': return 'Master Admin';
            case 'doctor': return 'Doctor';
            case 'nurse': return 'Nurse';
            case 'diagnostic_staff': return 'Diagnostic Staff';
            case 'lab_technician': return 'Lab Technician';
            case 'radiologist': return 'Radiologist';
            case 'therapeutic_staff': return 'Therapeutic Staff';
            case 'physiotherapist': return 'Physiotherapist';
            case 'nutritionist': return 'Nutritionist';
            case 'pharmacist': return 'Pharmacist';
            case 'receptionist': return 'Receptionist';
            case 'billing_officer': return 'Billing Officer';
            case 'ict_admin': return 'ICT Admin';
            case 'hr_admin': return 'HR Admin';
            case 'department_head': return 'Department Head';
            default: return userRole?.replace('_', ' ').toUpperCase() || 'Patient';
        }
    };

    const getAvatarColor = () => {
        switch(userRole) {
            case 'master_admin': return '#e74c3c';
            case 'doctor': return '#3498db';
            case 'nurse': return '#1abc9c';
            case 'radiologist': return '#9b59b6';
            case 'lab_technician': return '#3498db';
            case 'pharmacist': return '#9b59b6';
            case 'receptionist': return '#f39c12';
            default: return '#27ae60';
        }
    };

    return (
        <header className="main-header">
            <div className="header-container">
                {/* Left Section - Brand & User Info */}
                <div className="header-left">
                    <Link to={isRole('master_admin') ? '/admin' : '/dashboard'} className="brand-link">
                        <span className="brand-icon">🏥</span>
                        <span className="brand-text">E-Health</span>
                    </Link>
                    <div className="user-info-compact">
                        <div className="user-name-compact">Welcome, {user?.username}</div>
                        <div className="user-details-compact">
                            <span className="role-badge-compact">{getRoleDisplayName()}</span>
                            <span className="health-id-compact">
                                <span>🆔</span>
                                {user?.healthRecordId}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center Section - Navigation Menu */}
                <div className="header-center">
                    <div className="nav-menu">
                        {/* Master Admin Navigation */}
                        {isRole('master_admin') && (
                            <>
                                <Link to="/admin" className="nav-link">
                                    <span className="nav-icon">👑</span>
                                    <span className="nav-text">Dashboard</span>
                                </Link>
                                <Link to="/admin/roles" className="nav-link">
                                    <span className="nav-icon">⚙️</span>
                                    <span className="nav-text">Manage Roles</span>
                                </Link>
                                <Link to="/admin/verifications" className="nav-link">
                                    <span className="nav-icon">✅</span>
                                    <span className="nav-text">Verifications</span>
                                </Link>
                                {/* FIXED: Changed from /patients to /admin?tab=users */}
                                <Link to="/admin?tab=users" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">All Users</span>
                                </Link>
                            </>
                        )}

                        {/* Doctor Navigation */}
                        {isRole('doctor') && (
                            <>
                                <Link to="/doctor/dashboard" className="nav-link">
                                    <span className="nav-icon">📊</span>
                                    <span className="nav-text">Dashboard</span>
                                </Link>
                                <Link to="/my-patients" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">My Patients</span>
                                </Link>
                                <Link to="/prescriptions" className="nav-link">
                                    <span className="nav-icon">💊</span>
                                    <span className="nav-text">Prescriptions</span>
                                </Link>
                            </>
                        )}

                        {/* Receptionist Navigation */}
                        {isRole('receptionist') && (
                            <>
                                <Link to="/receptionist" className="nav-link">
                                    <span className="nav-icon">📋</span>
                                    <span className="nav-text">Dashboard</span>
                                </Link>
                                <Link to="/patients" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">Patient Management</span>
                                </Link>
                            </>
                        )}

                        {/* Radiologist Navigation */}
                        {isRole('radiologist') && (
                            <>
                                <Link to="/radiologist" className="nav-link">
                                    <span className="nav-icon">📷</span>
                                    <span className="nav-text">Radiology Dashboard</span>
                                </Link>
                                <Link to="/patients" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">Patients</span>
                                </Link>
                            </>
                        )}

                        {/* Lab Technician Navigation */}
                        {isRole('lab_technician') && (
                            <>
                                <Link to="/lab" className="nav-link">
                                    <span className="nav-icon">🔬</span>
                                    <span className="nav-text">Lab Dashboard</span>
                                </Link>
                                <Link to="/patients" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">Patients</span>
                                </Link>
                            </>
                        )}

                        {/* Pharmacist Navigation */}
                        {isRole('pharmacist') && (
                            <>
                                <Link to="/pharmacist" className="nav-link">
                                    <span className="nav-icon">💊</span>
                                    <span className="nav-text">Pharmacy Dashboard</span>
                                </Link>
                                <Link to="/prescriptions" className="nav-link">
                                    <span className="nav-icon">📋</span>
                                    <span className="nav-text">Prescriptions</span>
                                </Link>
                            </>
                        )}

                        {/* Nurse Navigation */}
                        {isRole('nurse') && (
                            <>
                                <Link to="/nurse" className="nav-link">
                                    <span className="nav-icon">👩‍⚕️</span>
                                    <span className="nav-text">Nurse Dashboard</span>
                                </Link>
                                <Link to="/patients" className="nav-link">
                                    <span className="nav-icon">👥</span>
                                    <span className="nav-text">Patients</span>
                                </Link>
                            </>
                        )}

                        {/* Billing Officer Navigation */}
                        {isRole('billing_officer') && (
                            <>
                                <Link to="/billing" className="nav-link">
                                    <span className="nav-icon">💰</span>
                                    <span className="nav-text">Billing Dashboard</span>
                                </Link>
                                <Link to="/finance" className="nav-link">
                                    <span className="nav-icon">📊</span>
                                    <span className="nav-text">Finance</span>
                                </Link>
                            </>
                        )}

                        {/* Patient / Default Navigation */}
                        {!isRole('master_admin') && 
                         !isRole('doctor') && 
                         !isRole('receptionist') && 
                         !isRole('radiologist') && 
                         !isRole('lab_technician') && 
                         !isRole('pharmacist') && 
                         !isRole('nurse') && 
                         !isRole('billing_officer') && (
                            <>
                                <Link to="/dashboard" className="nav-link">
                                    <span className="nav-icon">📊</span>
                                    <span className="nav-text">Dashboard</span>
                                </Link>
                                <Link to="/prescriptions" className="nav-link">
                                    <span className="nav-icon">💊</span>
                                    <span className="nav-text">My Prescriptions</span>
                                </Link>
                            </>
                        )}

                        {/* Permission-based Navigation Items */}
                        <PermissionGate permissions={['view_lab_requests', 'update_lab_results']}>
                            {!isRole('lab_technician') && !isRole('doctor') && (
                                <Link to="/lab-requests" className="nav-link">
                                    <span className="nav-icon">🔬</span>
                                    <span className="nav-text">Lab Requests</span>
                                </Link>
                            )}
                        </PermissionGate>
                        
                        <PermissionGate permissions={['view_invoices', 'create_invoices']}>
                            <Link to="/billing" className="nav-link">
                                <span className="nav-icon">💰</span>
                                <span className="nav-text">Billing</span>
                            </Link>
                        </PermissionGate>
                    </div>
                </div>

                {/* Right Section - User Avatar & Logout */}
                <div className="header-right">
                    <div className="user-dropdown">
                        <div className="user-avatar-circle" style={{ background: getAvatarColor() }}>
                            <span className="avatar-icon">{getRoleIcon()}</span>
                        </div>
                        <div className="dropdown-menu">
                            <Link to="/profile" className="dropdown-item">
                                <span className="dropdown-icon">👤</span>
                                Profile Settings
                            </Link>
                            <div className="dropdown-divider"></div>
                            <button onClick={handleLogout} className="dropdown-item logout-item">
                                <span className="dropdown-icon">🚪</span>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default RoleBasedNav;