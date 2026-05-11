// frontend/src/services/patientService.js
import api from './api';

class PatientService {
    async registerPatient(patientData) {
        try {
            const response = await api.post('/patients/register', patientData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPatients() {
        try {
            const response = await api.get('/patients');
            // Ensure each patient has verification_status
            const patients = response.data.map(patient => ({
                ...patient,
                verification_status: patient.verification_status || 'approved',
                // Also ensure role is set
                role: patient.role || 'patient'
            }));
            return patients;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getPatient(patientId) {
        try {
            const response = await api.get(`/patients/${patientId}`);
            const patient = response.data;
            return {
                ...patient,
                verification_status: patient.verification_status || 'approved'
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updatePatientVerification(patientId, status) {
        try {
            const response = await api.put(`/master-admin/users/${patientId}/verify`, { 
                verification_status: status 
            });
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

const patientService = new PatientService();
export default patientService;