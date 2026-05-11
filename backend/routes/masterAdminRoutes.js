// backend/routes/masterAdminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/permissions');
const RoleRequestService = require('../services/roleRequestService');

// Middleware to ensure user is master admin
const requireMasterAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        db.get(
            'SELECT role FROM users WHERE id = ?',
            [userId],
            (err, user) => {
                if (err || !user) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                
                if (user.role === 'master_admin') {
                    next();
                } else {
                    return res.status(403).json({ error: 'Master admin access required' });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Authorization error' });
    }
};

// Get all users with their verification status
router.get('/users', authenticateToken, requireMasterAdmin, (req, res) => {
    const { role, verification_status, limit = 100, offset = 0 } = req.query;
    
    let sql = `
        SELECT u.id, u.username, u.email, u.role, u.health_record_id, 
               u.verification_status, u.verified_by, u.verified_at, u.created_at,
               v.username as verified_by_username
        FROM users u
        LEFT JOIN users v ON u.verified_by = v.id
        WHERE 1=1
    `;
    const params = [];
    
    if (role) {
        sql += ' AND u.role = ?';
        params.push(role);
    }
    if (verification_status) {
        sql += ' AND u.verification_status = ?';
        params.push(verification_status);
    }
    
    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(sql, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Get a single user's details
router.get('/users/:userId', authenticateToken, requireMasterAdmin, (req, res) => {
    db.get(
        `SELECT u.id, u.username, u.email, u.role, u.health_record_id, 
                u.verification_status, u.verified_by, u.verified_at, u.created_at,
                v.username as verified_by_username
         FROM users u
         LEFT JOIN users v ON u.verified_by = v.id
         WHERE u.id = ?`,
        [req.params.userId],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

// Get pending role requests
router.get('/role-requests/pending', authenticateToken, requireMasterAdmin, async (req, res) => {
    try {
        const requests = await RoleRequestService.getPendingRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Get all role requests
router.get('/role-requests', authenticateToken, requireMasterAdmin, async (req, res) => {
    const { status, userId } = req.query;
    try {
        const requests = await RoleRequestService.getAllRequests({ status, userId });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Approve role request
router.post('/role-requests/:requestId/approve', authenticateToken, requireMasterAdmin, async (req, res) => {
    try {
        await RoleRequestService.approveRequest(req.params.requestId, req.user.userId);
        res.json({ success: true, message: 'Role request approved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

// Reject role request
router.post('/role-requests/:requestId/reject', authenticateToken, requireMasterAdmin, async (req, res) => {
    const { rejectionReason } = req.body;
    try {
        await RoleRequestService.rejectRequest(req.params.requestId, req.user.userId, rejectionReason);
        res.json({ success: true, message: 'Role request rejected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
});

// Create a new role (master admin only)
router.post('/roles', authenticateToken, requireMasterAdmin, (req, res) => {
    const { name, description, permissions } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Role name required' });
    }
    
    db.run(
        'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)',
        [name, description, JSON.stringify(permissions || [])],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Role already exists' });
                }
                return res.status(500).json({ error: 'Failed to create role' });
            }
            
            res.json({
                success: true,
                id: this.lastID,
                message: 'Role created successfully'
            });
        }
    );
});

// Update a role
router.put('/roles/:roleId', authenticateToken, requireMasterAdmin, (req, res) => {
    const { name, description, permissions } = req.body;
    
    db.run(
        'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
        [name, description, JSON.stringify(permissions || []), req.params.roleId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update role' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Role not found' });
            }
            
            res.json({ success: true, message: 'Role updated successfully' });
        }
    );
});

// Delete a role
router.delete('/roles/:roleId', authenticateToken, requireMasterAdmin, (req, res) => {
    // Check if role is assigned to any users
    db.get(
        'SELECT COUNT(*) as count FROM users WHERE role = (SELECT name FROM roles WHERE id = ?)',
        [req.params.roleId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (result.count > 0) {
                return res.status(400).json({ error: 'Cannot delete role assigned to users' });
            }
            
            db.run(
                'DELETE FROM roles WHERE id = ?',
                [req.params.roleId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete role' });
                    }
                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Role not found' });
                    }
                    
                    res.json({ success: true, message: 'Role deleted successfully' });
                }
            );
        }
    );
});

// Verify a user directly (without role request)
router.put('/users/:userId/verify', authenticateToken, requireMasterAdmin, (req, res) => {
    const { role } = req.body;
    
    db.run(
        `UPDATE users 
         SET role = ?, verification_status = 'approved', 
             verified_by = ?, verified_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [role, req.user.userId, req.params.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to verify user' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, message: 'User verified successfully' });
        }
    );
});

// Update user role
router.put('/users/:userId/role', authenticateToken, requireMasterAdmin, (req, res) => {
    const { role } = req.body;
    
    db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, req.params.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update user role' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, message: 'User role updated successfully' });
        }
    );
});

// Delete user (soft delete or hard delete)
router.delete('/users/:userId', authenticateToken, requireMasterAdmin, (req, res) => {
    // Check if user is trying to delete themselves
    if (parseInt(req.params.userId) === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    db.run(
        'DELETE FROM users WHERE id = ?',
        [req.params.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete user' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, message: 'User deleted successfully' });
        }
    );
});

// Get system statistics
router.get('/statistics', authenticateToken, requireMasterAdmin, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        verifiedUsers: 'SELECT COUNT(*) as count FROM users WHERE verification_status = "approved"',
        pendingVerification: 'SELECT COUNT(*) as count FROM users WHERE verification_status = "pending"',
        totalRoles: 'SELECT COUNT(*) as count FROM roles',
        pendingRequests: 'SELECT COUNT(*) as count FROM role_requests WHERE status = "pending"',
        roleDistribution: `
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role 
            ORDER BY count DESC
        `
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    for (const [key, query] of Object.entries(queries)) {
        db.all(query, [], (err, data) => {
            if (err) {
                results[key] = { error: err.message };
            } else {
                results[key] = key === 'roleDistribution' ? data : data[0];
            }
            
            completed++;
            if (completed === total) {
                res.json(results);
            }
        });
    }
});

module.exports = router;