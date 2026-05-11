// src/components/common/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';

const ProtectedRoute = ({ children, requiredPermissions = [], requireAll = false, requiredRole = null }) => {
    const { user, loading } = useAuth();
    const { hasAnyPermission, hasAllPermissions, isRole } = useRole();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Check role requirement
    if (requiredRole && !isRole(requiredRole)) {
        return <Navigate to="/dashboard" />;
    }

    // Check permissions
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

export default ProtectedRoute;