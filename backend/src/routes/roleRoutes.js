// backend/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { hasPermission, hasRole } = require('../middleware/permissions');
const { authenticateToken } = require('../middleware/auth');

// Get all roles (Admin/ICT only)
router.get('/', authenticateToken, hasPermission('manage_roles'), (req, res) => {
    db.all(
        'SELECT id, name, description, permissions, created_at FROM roles ORDER BY name',
        [],
        (err, roles) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            const rolesWithPermissions = roles.map(role => ({
                ...role,
                permissions: JSON.parse(role.permissions || '[]')
            }));
            
            res.json(rolesWithPermissions);
        }
    );
});

// Get single role
router.get('/:id', authenticateToken, hasPermission('manage_roles'), (req, res) => {
    db.get(
        'SELECT id, name, description, permissions, created_at FROM roles WHERE id = ?',
        [req.params.id],
        (err, role) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!role) {
                return res.status(404).json({ error: 'Role not found' });
            }
            
            role.permissions = JSON.parse(role.permissions || '[]');
            res.json(role);
        }
    );
});

// Create new role
router.post('/', authenticateToken, hasPermission('manage_roles'), (req, res) => {
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

// Update role
router.put('/:id', authenticateToken, hasPermission('manage_roles'), (req, res) => {
    const { name, description, permissions } = req.body;
    
    db.run(
        'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
        [name, description, JSON.stringify(permissions || []), req.params.id],
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

// Delete role
router.delete('/:id', authenticateToken, hasPermission('manage_roles'), (req, res) => {
    // Check if role is assigned to any users
    db.get(
        'SELECT COUNT(*) as count FROM users WHERE role = (SELECT name FROM roles WHERE id = ?)',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (result.count > 0) {
                return res.status(400).json({ error: 'Cannot delete role assigned to users' });
            }
            
            db.run(
                'DELETE FROM roles WHERE id = ?',
                [req.params.id],
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

// Get user's role and permissions
router.get('/my/permissions', authenticateToken, (req, res) => {
    db.get(
        'SELECT role FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            db.get(
                'SELECT name, description, permissions FROM roles WHERE name = ?',
                [user.role],
                (err, role) => {
                    if (err || !role) {
                        return res.status(404).json({ error: 'Role not found' });
                    }
                    
                    res.json({
                        role: role.name,
                        description: role.description,
                        permissions: JSON.parse(role.permissions || '[]')
                    });
                }
            );
        }
    );
});

// Assign role to user (Admin/ICT only)
router.put('/user/:userId/role', authenticateToken, hasPermission('manage_users'), (req, res) => {
    const { roleName } = req.body;
    
    if (!roleName) {
        return res.status(400).json({ error: 'Role name required' });
    }
    
    // Check if role exists
    db.get(
        'SELECT name FROM roles WHERE name = ?',
        [roleName],
        (err, role) => {
            if (err || !role) {
                return res.status(400).json({ error: 'Role does not exist' });
            }
            
            db.run(
                'UPDATE users SET role = ? WHERE id = ?',
                [roleName, req.params.userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to assign role' });
                    }
                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'User not found' });
                    }
                    
                    res.json({ success: true, message: 'Role assigned successfully' });
                }
            );
        }
    );
});

// Get all staff members
router.get('/staff/all', authenticateToken, hasAnyPermission(['manage_staff', 'view_department_stats']), (req, res) => {
    const sql = `
        SELECT u.id, u.username, u.email, u.role, u.created_at,
               s.staff_id, s.department, s.specialization, s.qualification,
               s.license_number, s.years_of_experience, s.contact_number,
               s.employment_date, s.status
        FROM users u
        LEFT JOIN staff_details s ON u.id = s.user_id
        WHERE u.role != 'patient'
        ORDER BY u.created_at DESC
    `;
    
    db.all(sql, [], (err, staff) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(staff);
    });
});

// Create staff member
router.post('/staff', authenticateToken, hasPermission('manage_staff'), (req, res) => {
    const {
        userId,
        staffId,
        department,
        specialization,
        qualification,
        licenseNumber,
        yearsOfExperience,
        contactNumber,
        emergencyContact,
        employmentDate
    } = req.body;
    
    db.run(
        `INSERT INTO staff_details 
         (user_id, staff_id, department, specialization, qualification, 
          license_number, years_of_experience, contact_number, emergency_contact, employment_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId, staffId, department, specialization, qualification,
            licenseNumber, yearsOfExperience, contactNumber, emergencyContact, employmentDate
        ],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create staff record' });
            }
            
            res.json({
                success: true,
                id: this.lastID,
                message: 'Staff record created successfully'
            });
        }
    );
});

module.exports = router;