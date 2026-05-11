class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.passwordHash = data.password_hash || '';
        this.fingerprintTemplate = data.fingerprint_template || null;
        this.fingerprintId = data.fingerprint_id || null;
        this.healthRecordId = data.health_record_id || '';
        this.role = data.role || 'patient';
        this.isActive = data.is_active !== undefined ? data.is_active : true;
        this.lastLogin = data.last_login || null;
        this.createdAt = data.created_at || new Date().toISOString();
        this.updatedAt = data.updated_at || new Date().toISOString();
    }

    validate() {
        const errors = [];
        
        if (!this.username || this.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            healthRecordId: this.healthRecordId,
            role: this.role,
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            createdAt: this.createdAt
        };
    }
}

module.exports = User;