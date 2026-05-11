// backend/services/auditService.js
const db = require('../config/database');

class AuditService {
    // Log user action
    static async log(userId, action, entityType, entityId = null, details = null, ipAddress = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    // Get audit logs with filters
    static async getLogs(filters = {}) {
        const { userId, action, entityType, startDate, endDate, limit = 100, offset = 0 } = filters;
        
        let sql = `
            SELECT al.*, u.username 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (userId) {
            sql += ' AND al.user_id = ?';
            params.push(userId);
        }
        if (action) {
            sql += ' AND al.action = ?';
            params.push(action);
        }
        if (entityType) {
            sql += ' AND al.entity_type = ?';
            params.push(entityType);
        }
        if (startDate) {
            sql += ' AND al.created_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND al.created_at <= ?';
            params.push(endDate);
        }
        
        sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, logs) => {
                if (err) reject(err);
                else resolve(logs);
            });
        });
    }
    
    // Get user activity summary
    static async getUserActivitySummary(userId, days = 30) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT action, COUNT(*) as count, DATE(created_at) as date
                 FROM audit_logs
                 WHERE user_id = ? AND created_at >= DATE('now', ?)
                 GROUP BY action, DATE(created_at)
                 ORDER BY date DESC`,
                [userId, `-${days} days`],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    }
}

module.exports = AuditService;