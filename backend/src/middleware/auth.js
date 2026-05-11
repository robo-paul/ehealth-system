const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please login again.' 
            });
        }
        return res.status(403).json({ 
            error: 'Invalid token.' 
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions.' 
            });
        }

        next();
    };
};

const validateFingerprintSession = async (req, res, next) => {
    // Check if fingerprint session is still valid
    // This could involve checking a separate session store
    
    const fingerprintSessionId = req.headers['x-fingerprint-session'];
    
    if (!fingerprintSessionId) {
        return res.status(401).json({ 
            error: 'Fingerprint session required for this operation.' 
        });
    }

    // Validate fingerprint session (implement based on your session management)
    const isValid = await validateFingerprintSessionId(fingerprintSessionId);
    
    if (!isValid) {
        return res.status(401).json({ 
            error: 'Invalid or expired fingerprint session.' 
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    validateFingerprintSession
};