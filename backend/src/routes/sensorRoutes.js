const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/sensorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

module.exports = (sensor) => {
    const sensorController = new SensorController(sensor);

    // Public sensor status
    router.get('/status', (req, res) => 
        sensorController.getStatus(req, res)
    );

    // Protected sensor operations
    router.use(authenticateToken);

    // Test sensor connection
    router.post('/test', authorizeRoles('admin'), (req, res) => 
        sensorController.testConnection(req, res)
    );

    // Calibrate sensor
    router.post('/calibrate', authorizeRoles('admin'), (req, res) => 
        sensorController.calibrate(req, res)
    );

    // Get sensor statistics
    router.get('/stats', authorizeRoles('admin'), (req, res) => 
        sensorController.getStatistics(req, res)
    );

    // Reconnect sensor
    router.post('/reconnect', authorizeRoles('admin'), (req, res) => 
        sensorController.reconnect(req, res)
    );

    // Get last scan result
    router.get('/last-scan', (req, res) => 
        sensorController.getLastScan(req, res)
    );

    return router;
};