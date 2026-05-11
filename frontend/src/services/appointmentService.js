// src/services/appointmentService.js
import api from './api';

class AppointmentService {
    async getAppointments() {
        try {
            // Use the sync endpoint which returns appointments for both patients and doctors
            const response = await api.get('/appointments/sync');
            // Return empty array if no appointments
            return response.data || [];
        } catch (error) {
            console.error('Error fetching appointments:', error);
            // Return empty array instead of throwing error
            return [];
        }
    }

    async getAppointmentById(id) {
        try {
            const response = await api.get(`/appointments/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createAppointment(appointmentData) {
        try {
            // The backend now expects patient_id for receptionist/admin bookings
            const response = await api.post('/appointments', appointmentData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateAppointment(id, appointmentData) {
        try {
            const response = await api.put(`/appointments/${id}`, appointmentData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async cancelAppointment(id) {
        try {
            const response = await api.delete(`/appointments/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAvailableSlots(doctorId, date) {
        try {
            const response = await api.get(`/appointments/available/${doctorId}`, {
                params: { date }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // New method: Get appointments for a specific patient (for doctors/receptionists)
    async getPatientAppointments(patientId) {
        try {
            const response = await api.get(`/appointments/patient/${patientId}`);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching patient appointments:', error);
            return [];
        }
    }

    // New method: Get appointments for a specific doctor
    async getDoctorAppointments(doctorId) {
        try {
            const response = await api.get(`/appointments/doctor/${doctorId}`);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            return [];
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

const appointmentService = new AppointmentService();
export default appointmentService;