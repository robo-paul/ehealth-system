// src/components/common/PermissionGate.js
import React from 'react';
import { useRole } from '../../context/RoleContext';

const PermissionGate = ({ 
    children, 
    permissions, 
    requireAll = false,
    fallback = null 
}) => {
    const { hasAnyPermission, hasAllPermissions, loading } = useRole();
    
    if (loading) {
        return <div className="loading-spinner">Loading permissions...</div>;
    }
    
    let hasAccess = false;
    
    if (permissions) {
        if (requireAll) {
            hasAccess = hasAllPermissions(permissions);
        } else {
            hasAccess = hasAnyPermission(permissions);
        }
    }
    
    return hasAccess ? children : fallback;
};

export default PermissionGate;