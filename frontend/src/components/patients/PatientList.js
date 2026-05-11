// frontend/src/components/patients/PatientList.js
import React, { useState, useEffect, useCallback } from 'react';
import patientService from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import './PatientList.css';

const PatientList = ({ refresh }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showError } = useToast();

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await patientService.getPatients();
            console.log('Patients with verification status:', data);
            setPatients(data);
        } catch (error) {
            showError('Failed to load patients');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchPatients();
    }, [refresh, fetchPatients]);

    const filteredPatients = patients.filter(patient =>
        patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.health_record_id && patient.health_record_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (patient) => {
        // Check verification_status
        if (patient.verification_status === 'approved') {
            return <span className="status-badge verified">✅ Verified</span>;
        } else if (patient.verification_status === 'pending') {
            return <span className="status-badge pending">⏳ Pending</span>;
        } else if (patient.verification_status === 'rejected') {
            return <span className="status-badge rejected">❌ Rejected</span>;
        }
        // Default fallback
        return <span className="status-badge active">✅ Active</span>;
    };

    if (loading) {
        return <div className="patients-loading">Loading patients...</div>;
    }

    if (patients.length === 0) {
        return (
            <div className="patients-empty">
                <p>No patients registered yet.</p>
                <p>Click "Register New Patient" to add the first patient.</p>
            </div>
        );
    }

    return (
        <div className="patient-list">
            <div className="patient-search">
                <input
                    type="text"
                    placeholder="Search by username, email or health record ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="patients-table-container">
                <table className="patients-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Health Record ID</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map((patient) => (
                            <tr key={patient.id}>
                                <td>{patient.id}</td>
                                <td>
                                    <strong>{patient.username}</strong>
                                    {patient.patient_status === 'admitted' && (
                                        <span className="admitted-badge">Admitted</span>
                                    )}
                                </td>
                                <td>{patient.email || '-'}</td>
                                <td>
                                    <code>{patient.health_record_id}</code>
                                </td>
                                <td>
                                    <span className={`role-badge role-${patient.role}`}>
                                        {patient.role?.toUpperCase() || 'PATIENT'}
                                    </span>
                                </td>
                                <td>{getStatusBadge(patient)}</td>
                                <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="patient-stats">
                Total Patients: {filteredPatients.length}
            </div>
        </div>
    );
};

export default PatientList;