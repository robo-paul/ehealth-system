module.exports = {
    // Sensor communication settings
    sensor: {
        defaultPort: process.env.SENSOR_PORT || 'COM3',
        baudRate: parseInt(process.env.SENSOR_BAUD_RATE) || 57600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        timeout: parseInt(process.env.SENSOR_TIMEOUT) || 10000,
        retryAttempts: parseInt(process.env.SENSOR_RETRY_ATTEMPTS) || 3
    },
    
    // Command codes for fingerprint sensor
    commands: {
        GET_IMAGE: 0x01,
        GEN_TEMPLATE: 0x02,
        SEARCH: 0x04,
        REG_MODEL: 0x05,
        STORE: 0x06,
        LOAD: 0x07,
        UPLOAD: 0x08,
        DELETE: 0x0C,
        EMPTY: 0x0D,
        SET_PASSWORD: 0x12,
        VERIFY_PASSWORD: 0x13,
        GET_RANDOM_CODE: 0x14,
        SET_ADDRESS: 0x15
    },
    
    // Response codes
    responses: {
        SUCCESS: 0x00,
        ERROR_COMMUNICATION: 0x01,
        ERROR_NO_FINGER: 0x02,
        ERROR_FAIL_TO_CAPTURE: 0x03,
        ERROR_FAIL_TO_GENERATE: 0x06,
        ERROR_FAIL_TO_ENROLL: 0x07,
        ERROR_DUPLICATE: 0x09,
        ERROR_DB_FULL: 0x0B,
        ERROR_NO_SUCH_ID: 0x0C,
        ERROR_USER_EXISTS: 0x0D
    },
    
    // Template settings
    template: {
        maxSize: 512,
        format: 'ISO_19794_2',
        minQuality: 50
    }
};