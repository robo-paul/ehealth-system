// src/services/prescriptionService.js
import api from './api';

class PrescriptionService {
    async getPrescriptions() {
        try {
            const response = await api.get('/prescriptions');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPrescriptionById(id) {
        try {
            const response = await api.get(`/prescriptions/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createPrescription(prescriptionData) {
        try {
            const response = await api.post('/prescriptions', prescriptionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updatePrescription(id, prescriptionData) {
        try {
            const response = await api.put(`/prescriptions/${id}`, prescriptionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deletePrescription(id) {
        try {
            const response = await api.delete(`/prescriptions/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async refillPrescription(id) {
        try {
            const response = await api.post(`/prescriptions/${id}/refill`);
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

const prescriptionService = new PrescriptionService();
export default prescriptionService;