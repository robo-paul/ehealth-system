const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    if (!username || username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }

    if (email && !isValidEmail(email)) {
        errors.push('Invalid email format');
    }

    if (password && password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateHealthRecord = (req, res, next) => {
    const { recordData, recordType } = req.body;
    const errors = [];

    if (!recordData) {
        errors.push('Record data is required');
    }

    if (recordType && !['general', 'prescription', 'lab_result', 'imaging', 'vaccination'].includes(recordType)) {
        errors.push('Invalid record type');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username) {
        errors.push('Username is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

module.exports = {
    validateRegistration,
    validateHealthRecord,
    validateLogin
};