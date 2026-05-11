// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { RoleProvider, useRole } from './context/RoleContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import FAQPage from './pages/FAQPage';
import SolutionsPage from './pages/SolutionsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import PatientManagementTable from './components/patients/PatientManagementTable';
import RoleBasedNav from './components/common/RoleBasedNav';
import PatientList from './components/doctor/PatientList';
import PrescriptionList from './components/prescriptions/PrescriptionList';
import MasterAdminDashboard from './pages/admin/MasterAdminDashboard';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import UserVerificationPage from './pages/admin/UserVerificationPage';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import ReceptionistDashboard from './components/receptionist/ReceptionistDashboard';
import RadiologistDashboard from './components/radiologist/RadiologistDashboard';
import LabTechnicianDashboard from './components/lab/LabTechnicianDashboard';
import PharmacistDashboard from './components/pharmacist/PharmacistDashboard';
import NurseDashboard from './components/nurse/NurseDashboard';
import BillingOfficerDashboard from './components/billing/BillingOfficerDashboard';
import HospitalAdminDashboard from './components/admin/HospitalAdminDashboard';
import FinanceDashboard from './components/finance/FinanceDashboard';
import './styles/App.css';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole, requiredPermissions = [], requireAll = false }) => {
    const { user, loading } = useAuth();
    const { hasAnyPermission, hasAllPermissions, isRole } = useRole();
    
    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (requiredRole && !isRole(requiredRole)) {
        if (isRole('master_admin')) {
            return <Navigate to="/admin" />;
        }
        return <Navigate to="/dashboard" />;
    }
    
    if (requiredPermissions.length > 0) {
        let hasAccess = false;
        
        if (requireAll) {
            hasAccess = hasAllPermissions(requiredPermissions);
        } else {
            hasAccess = hasAnyPermission(requiredPermissions);
        }
        
        if (!hasAccess) {
            return <Navigate to="/dashboard" />;
        }
    }
    
    return children;
};

// Public Route component
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const { isRole } = useRole();
    
    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }
    
    if (!user) {
        return children;
    }
    
    if (isRole('master_admin')) {
        return <Navigate to="/admin" />;
    }
    return <Navigate to="/dashboard" />;
};

function AppContent() {
    const { user } = useAuth();
    
    return (
        <div className="app">
            <header className="app-header">
                <h1>🏥 E-Health System</h1>
                {user && user.verification_status === 'pending' && (
                    <div className="verification-banner">
                        ⏳ Your account is pending verification. Some features may be limited.
                    </div>
                )}
            </header>
            
            {user && <RoleBasedNav />}
            
            <main className="app-main">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    } />
                    <Route path="/solutions" element={<SolutionsPage />} />
                    <Route path="/register" element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    } />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    
                    {/* Master Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute requiredRole="master_admin">
                            <MasterAdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/roles" element={
                        <ProtectedRoute requiredRole="master_admin">
                            <RoleManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/verifications" element={
                        <ProtectedRoute requiredRole="master_admin">
                            <UserVerificationPage />
                        </ProtectedRoute>
                    } />
                    
                    {/* Hospital Admin Routes */}
                    <Route path="/hospital-admin" element={
                        <ProtectedRoute requiredRole="master_admin">
                            <HospitalAdminDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Patient Management - For receptionist and master admin */}
                    <Route path="/patients" element={
                        <ProtectedRoute>
                            <PatientManagementTable />
                        </ProtectedRoute>
                    } />
                    
                    {/* Doctor Routes */}
                    <Route path="/doctor/dashboard" element={
                        <ProtectedRoute requiredRole="doctor">
                            <DoctorDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/my-patients" element={
                        <ProtectedRoute requiredRole="doctor">
                            <PatientList />
                        </ProtectedRoute>
                    } />
                    <Route path="/prescriptions" element={
                        <ProtectedRoute>
                            <PrescriptionList />
                        </ProtectedRoute>
                    } />
                    
                    {/* Receptionist Routes */}
                    <Route path="/receptionist" element={
                        <ProtectedRoute requiredRole="receptionist">
                            <ReceptionistDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Radiologist Routes */}
                    <Route path="/radiologist" element={
                        <ProtectedRoute requiredRole="radiologist">
                            <RadiologistDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Lab Technician Routes */}
                    <Route path="/lab" element={
                        <ProtectedRoute requiredRole="lab_technician">
                            <LabTechnicianDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Pharmacist Routes */}
                    <Route path="/pharmacist" element={
                        <ProtectedRoute requiredRole="pharmacist">
                            <PharmacistDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Nurse Routes */}
                    <Route path="/nurse" element={
                        <ProtectedRoute requiredRole="nurse">
                            <NurseDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Billing Officer Routes */}
                    <Route path="/billing" element={
                        <ProtectedRoute requiredRole="billing_officer">
                            <BillingOfficerDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* Finance Routes */}
                    <Route path="/finance" element={
                        <ProtectedRoute requiredRole="billing_officer">
                            <FinanceDashboard />
                        </ProtectedRoute>
                    } />
                    
                    {/* User Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />
                    
                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            
            <footer className="app-footer">
                <div className="footer-content">
                    <p>&copy; 2025 E-Health System. All rights reserved.</p>
                    <p>Secure Electronic Health Records with Fingerprint Authentication</p>
                </div>
            </footer>
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <Router
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <AuthProvider>
                    <RoleProvider>
                        <ToastProvider>
                            <LoadingProvider>
                                <AppContent />
                            </LoadingProvider>
                        </ToastProvider>
                    </RoleProvider>
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;