const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const User = require('../models/User');
const FingerprintSensor = require('../services/fingerprintSensor');
const logger = require('../utils/logger');

class AuthController {
    constructor(sensor) {
        this.sensor = sensor;
    }

    // Register new user with fingerprint
    async register(req, res) {
        try {
            const { username, email, password, healthRecordId } = req.body;
            
            // Check if user exists
            const existingUser = await this.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password if provided
            let passwordHash = null;
            if (password) {
                passwordHash = await bcrypt.hash(password, 10);
            }

            // Create user
            const userId = await this.createUser({
                username,
                email,
                passwordHash,
                healthRecordId
            });

            // Start fingerprint enrollment
            if (this.sensor && this.sensor.isConnected) {
                res.json({
                    status: 'enrolling',
                    message: 'Please place your finger on the sensor',
                    userId
                });

                // Continue enrollment in background
                this.enrollFingerprint(userId).catch(error => {
                    logger.error('Fingerprint enrollment failed:', error);
                });
            } else {
                res.json({
                    success: true,
                    message: 'User registered successfully. Sensor not available for fingerprint enrollment.',
                    userId
                });
            }
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    // Login with fingerprint
    async loginWithFingerprint(req, res) {
        try {
            const { username } = req.body;

            if (!this.sensor || !this.sensor.isConnected) {
                return res.status(503).json({ 
                    error: 'Fingerprint sensor not available',
                    fallback: 'Use password login instead'
                });
            }

            // Scan fingerprint
            const scanResult = await this.sensor.identifyFingerprint();
            
            if (!scanResult.success) {
                return res.status(401).json({ 
                    error: 'Fingerprint not recognized' 
                });
            }

            // Find user by fingerprint ID
            const user = await this.findUserByFingerprintId(scanResult.userId);
            
            if (!user) {
                return res.status(401).json({ 
                    error: 'User not found for this fingerprint' 
                });
            }

            // Generate JWT
            const token = this.generateToken(user);

            // Update last login
            await this.updateLastLogin(user.id);

            // Log the action
            await this.logAction(user.id, 'fingerprint_login', req.ip);

            res.json({
                success: true,
                token,
                user: user.toJSON()
            });
        } catch (error) {
            logger.error('Fingerprint login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    // Login with password (fallback)
    async loginWithPassword(req, res) {
        try {
            const { username, password } = req.body;

            const user = await this.findUserByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = this.generateToken(user);
            await this.updateLastLogin(user.id);
            await this.logAction(user.id, 'password_login', req.ip);

            res.json({
                success: true,
                token,
                user: user.toJSON()
            });
        } catch (error) {
            logger.error('Password login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    // Helper methods
    async findUserByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? new User(row) : null);
                }
            );
        });
    }

    async findUserByFingerprintId(fingerprintId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE fingerprint_id = ?',
                [fingerprintId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? new User(row) : null);
                }
            );
        });
    }

    async createUser(userData) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (username, email, password_hash, health_record_id)
                 VALUES (?, ?, ?, ?)`,
                [userData.username, userData.email, userData.passwordHash, userData.healthRecordId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async enrollFingerprint(userId) {
        try {
            const result = await this.sensor.enrollFingerprint(userId);
            
            if (result.success) {
                // Update user with fingerprint ID
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE users SET fingerprint_id = ?, fingerprint_template = ? WHERE id = ?',
                        [result.userId, Buffer.from(result.template), userId],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                // Store template in separate table
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO fingerprint_templates (user_id, template_data, quality_score)
                         VALUES (?, ?, ?)`,
                        [userId, Buffer.from(result.template), result.quality || 100],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                logger.info(`Fingerprint enrolled for user ${userId}`);
            }
        } catch (error) {
            logger.error(`Fingerprint enrollment failed for user ${userId}:`, error);
            throw error;
        }
    }

    generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                healthRecordId: user.healthRecordId
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [userId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async logAction(userId, action, ipAddress) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
                [userId, action, ipAddress],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}

module.exports = AuthController;