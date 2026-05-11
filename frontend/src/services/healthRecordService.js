// src/services/healthRecordService.js
import api from './api';

class HealthRecordService {
    async getRecords() {
        try {
            const response = await api.get('/health-records');
            // Return empty array if no records
            return response.data || [];
        } catch (error) {
            console.error('Error fetching health records:', error);
            // Return empty array instead of throwing error
            return [];
        }
    }

    async createRecord(recordData) {
        try {
            const response = await api.post('/health-records', { recordData });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // NEW: Create record with file attachment
    async createRecordWithFile(recordData, file) {
        try {
            const formData = new FormData();
            formData.append('recordData', JSON.stringify(recordData));
            if (file) {
                formData.append('file', file);
            }
            
            const response = await api.post('/health-records/with-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateRecord(id, recordData) {
        try {
            const response = await api.put(`/health-records/${id}`, { recordData });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteRecord(id) {
        try {
            const response = await api.delete(`/health-records/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // NEW: Get attachments for a record
    async getAttachments(recordId) {
        try {
            const response = await api.get(`/health-records/${recordId}/attachments`);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching attachments:', error);
            return [];
        }
    }

    // NEW: Download attachment
    async downloadAttachment(attachmentId) {
        try {
            const response = await api.get(`/health-records/attachments/${attachmentId}/download`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // NEW: Delete attachment
    async deleteAttachment(attachmentId) {
        try {
            const response = await api.delete(`/health-records/attachments/${attachmentId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            return new Error(error.response.data.error || 'Server error');
        } else if (error.request) {
            return new Error('No response from server');
        } else {
            return new Error('Request failed');
        }
    }
}

const healthRecordService = new HealthRecordService();
export default healthRecordService;