module.exports = {
    // User roles
    USER_ROLES: {
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        NURSE: 'nurse',
        ADMIN: 'admin',
        RECEPTIONIST: 'receptionist'
    },

    // Record types
    RECORD_TYPES: {
        GENERAL: 'general',
        PRESCRIPTION: 'prescription',
        LAB_RESULT: 'lab_result',
        IMAGING: 'imaging',
        VACCINATION: 'vaccination',
        SURGERY: 'surgery',
        ALLERGY: 'allergy'
    },

    // Sensor response codes
    SENSOR_RESPONSES: {
        SUCCESS: 0x00,
        NO_FINGER: 0x02,
        CAPTURE_FAILED: 0x03,
        DUPLICATE: 0x09,
        DB_FULL: 0x0B,
        NOT_FOUND: 0x0C
    },

    // HTTP Status codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },

    // JWT settings
    JWT: {
        EXPIRY: '24h',
        REFRESH_EXPIRY: '7d'
    },

    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    }
};