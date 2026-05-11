const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

module.exports = (sensor) => {
    const authController = new AuthController(sensor);

    // Public routes
    router.post('/register', validateRegistration, (req, res) => 
        authController.register(req, res)
    );

    router.post('/login/fingerprint', (req, res) => 
        authController.loginWithFingerprint(req, res)
    );

    router.post('/login/password', validateLogin, (req, res) => 
        authController.loginWithPassword(req, res)
    );

    // Protected routes
    router.get('/verify', authenticateToken, (req, res) => {
        res.json({ valid: true, user: req.user });
    });

    router.post('/logout', authenticateToken, (req, res) => {
        // Implement logout logic (invalidate token, etc.)
        res.json({ success: true, message: 'Logged out successfully' });
    });

    return router;
};