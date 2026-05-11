const express = require('express');
const router = express.Router();
const HealthRecordController = require('../controllers/healthRecordController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateHealthRecord } = require('../middleware/validation');

module.exports = () => {
    const healthRecordController = new HealthRecordController();

    // All routes require authentication
    router.use(authenticateToken);

    // Get all records for current user
    router.get('/', (req, res) => 
        healthRecordController.getUserRecords(req, res)
    );

    // Get single record
    router.get('/:id', (req, res) => 
        healthRecordController.getRecordById(req, res)
    );

    // Create new record
    router.post('/', validateHealthRecord, (req, res) => 
        healthRecordController.createRecord(req, res)
    );

    // Update record
    router.put('/:id', validateHealthRecord, (req, res) => 
        healthRecordController.updateRecord(req, res)
    );

    // Delete record (doctors only)
    router.delete('/:id', authorizeRoles('doctor', 'admin'), (req, res) => 
        healthRecordController.deleteRecord(req, res)
    );

    // Share record with another doctor
    router.post('/:id/share', authorizeRoles('patient', 'doctor'), (req, res) => 
        healthRecordController.shareRecord(req, res)
    );

    // Get record history
    router.get('/:id/history', (req, res) => 
        healthRecordController.getRecordHistory(req, res)
    );

    return router;
};