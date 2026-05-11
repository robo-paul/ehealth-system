// backend/services/roleRequestService.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a direct database connection for this service
const dbPath = path.resolve(__dirname, '../ehealth.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

class RoleRequestService {
    /**
     * Create a new role request
     * @param {number} userId - ID of the user requesting the role
     * @param {string} requestedRole - The role being requested (e.g., 'doctor', 'nurse')
     * @param {Array} documents - Array of document references (optional)
     * @param {string} reason - Reason for requesting the role
     * @returns {Promise<number>} - The ID of the created request
     */
    static async createRequest(userId, requestedRole, documents = [], reason = '') {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO role_requests (user_id, requested_role, documents, reason, status, created_at)
                VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
            `;
            
            db.run(sql, [userId, requestedRole, JSON.stringify(documents), reason], function(err) {
                if (err) {
                    console.error('Error creating role request:', err);
                    reject(err);
                } else {
                    console.log(`✅ Role request created for user ${userId} for role ${requestedRole}`);
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Get all pending role requests
     * @returns {Promise<Array>} - Array of pending role requests with user details
     */
    static async getPendingRequests() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT rr.*, u.username, u.email, u.health_record_id, u.role as current_role
                FROM role_requests rr
                JOIN users u ON rr.user_id = u.id
                WHERE rr.status = 'pending'
                ORDER BY rr.created_at DESC
            `;
            
            db.all(sql, [], (err, requests) => {
                if (err) {
                    console.error('Error getting pending requests:', err);
                    reject(err);
                } else {
                    resolve(requests);
                }
            });
        });
    }

    /**
     * Get all role requests with optional filters
     * @param {Object} filters - Filter options
     * @param {string} filters.status - Filter by status (pending, approved, rejected)
     * @param {number} filters.userId - Filter by user ID
     * @param {number} filters.limit - Maximum number of records to return
     * @param {number} filters.offset - Number of records to skip
     * @returns {Promise<Array>} - Array of role requests
     */
    static async getAllRequests(filters = {}) {
        const { status, userId, limit = 100, offset = 0 } = filters;
        
        let sql = `
            SELECT rr.*, u.username, u.email, u.health_record_id, u.role as current_role,
                   v.username as verified_by_username
            FROM role_requests rr
            JOIN users u ON rr.user_id = u.id
            LEFT JOIN users v ON rr.verified_by = v.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            sql += ' AND rr.status = ?';
            params.push(status);
        }
        if (userId) {
            sql += ' AND rr.user_id = ?';
            params.push(userId);
        }
        
        sql += ' ORDER BY rr.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, requests) => {
                if (err) {
                    console.error('Error getting all requests:', err);
                    reject(err);
                } else {
                    resolve(requests);
                }
            });
        });
    }

    /**
     * Approve a role request
     * @param {number} requestId - ID of the request to approve
     * @param {number} verifierId - ID of the admin approving the request
     * @returns {Promise<Object>} - Success status
     */
    static async approveRequest(requestId, verifierId) {
        return new Promise((resolve, reject) => {
            // First get the request details
            db.get('SELECT user_id, requested_role FROM role_requests WHERE id = ?', [requestId], (err, request) => {
                if (err) {
                    console.error('Error getting request:', err);
                    reject(err);
                    return;
                }
                
                if (!request) {
                    reject(new Error('Request not found'));
                    return;
                }
                
                // Update user's role and verification status
                db.run(
                    `UPDATE users 
                     SET role = ?, verification_status = 'approved', 
                         verified_by = ?, verified_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [request.requested_role, verifierId, request.user_id],
                    (err) => {
                        if (err) {
                            console.error('Error updating user:', err);
                            reject(err);
                            return;
                        }
                        
                        // Update request status
                        db.run(
                            `UPDATE role_requests 
                             SET status = 'approved', verified_by = ?, verified_at = CURRENT_TIMESTAMP
                             WHERE id = ?`,
                            [verifierId, requestId],
                            (err) => {
                                if (err) {
                                    console.error('Error updating request:', err);
                                    reject(err);
                                } else {
                                    console.log(`✅ Role request ${requestId} approved. User ${request.user_id} is now ${request.requested_role}`);
                                    resolve({ success: true, message: 'Role request approved successfully' });
                                }
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Reject a role request
     * @param {number} requestId - ID of the request to reject
     * @param {number} verifierId - ID of the admin rejecting the request
     * @param {string} rejectionReason - Reason for rejection
     * @returns {Promise<Object>} - Success status
     */
    static async rejectRequest(requestId, verifierId, rejectionReason) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE role_requests 
                 SET status = 'rejected', verified_by = ?, verified_at = CURRENT_TIMESTAMP, rejection_reason = ?
                 WHERE id = ?`,
                [verifierId, rejectionReason, requestId],
                function(err) {
                    if (err) {
                        console.error('Error rejecting request:', err);
                        reject(err);
                    } else {
                        console.log(`❌ Role request ${requestId} rejected`);
                        resolve({ success: true, message: 'Role request rejected' });
                    }
                }
            );
        });
    }

    /**
     * Get the status of a user's most recent role request
     * @param {number} userId - ID of the user
     * @returns {Promise<Object|null>} - The most recent role request or null
     */
    static async getUserRequestStatus(userId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM role_requests 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC LIMIT 1`,
                [userId],
                (err, request) => {
                    if (err) {
                        console.error('Error getting user request status:', err);
                        reject(err);
                    } else {
                        resolve(request);
                    }
                }
            );
        });
    }

    /**
     * Check if a user has a pending role request
     * @param {number} userId - ID of the user
     * @returns {Promise<boolean>} - True if user has a pending request
     */
    static async hasPendingRequest(userId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM role_requests 
                 WHERE user_id = ? AND status = 'pending'`,
                [userId],
                (err, result) => {
                    if (err) {
                        console.error('Error checking pending request:', err);
                        reject(err);
                    } else {
                        resolve(result.count > 0);
                    }
                }
            );
        });
    }

    /**
     * Delete old/rejected role requests
     * @param {number} daysOld - Delete requests older than this many days
     * @returns {Promise<number>} - Number of deleted records
     */
    static async cleanupOldRequests(daysOld = 30) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM role_requests 
                 WHERE status IN ('rejected', 'approved') 
                 AND created_at < datetime('now', ?)`,
                [`-${daysOld} days`],
                function(err) {
                    if (err) {
                        console.error('Error cleaning up old requests:', err);
                        reject(err);
                    } else {
                        console.log(`🧹 Cleaned up ${this.changes} old role requests`);
                        resolve(this.changes);
                    }
                }
            );
        });
    }
}

module.exports = RoleRequestService;