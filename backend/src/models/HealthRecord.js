class HealthRecord {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.user_id || null;
        this.recordType = data.record_type || 'general';
        this.recordData = this.parseRecordData(data.record_data);
        this.doctorNotes = data.doctor_notes || '';
        this.attachments = data.attachments ? JSON.parse(data.attachments) : [];
        this.isConfidential = data.is_confidential || false;
        this.createdAt = data.created_at || new Date().toISOString();
        this.updatedAt = data.updated_at || new Date().toISOString();
    }

    parseRecordData(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {
                return { text: data };
            }
        }
        return data || {};
    }

    validate() {
        const errors = [];
        
        if (!this.userId) {
            errors.push('User ID is required');
        }
        
        if (!this.recordData || Object.keys(this.recordData).length === 0) {
            errors.push('Record data is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            recordType: this.recordType,
            recordData: this.recordData,
            doctorNotes: this.doctorNotes,
            attachments: this.attachments,
            isConfidential: this.isConfidential,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = HealthRecord;