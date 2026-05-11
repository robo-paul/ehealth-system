// src/components/patients/PatientManagementTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '../../context/RoleContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './PatientManagement.css';

const PatientManagementTable = () => {
    const { isRole } = useRole();
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
    const [showPrescribeModal, setShowPrescribeModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [activeAdmissions, setActiveAdmissions] = useState([]);
    const [diagnosticFile, setDiagnosticFile] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [prescriptionData, setPrescriptionData] = useState({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        refills: 0
    });
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        contactNumber: '',
        emergencyContact: ''
    });
    const [admissionData, setAdmissionData] = useState({
        ward: '',
        bedNumber: '',
        reason: '',
        diagnosis: '',
        expectedStayDays: 1
    });
    const [dischargeData, setDischargeData] = useState({
        notes: '',
        instructions: ''
    });
    const [diagnosticData, setDiagnosticData] = useState({
        recordType: 'lab_result',
        testType: '',
        description: ''
    });

    const canRegisterPatient = isRole('receptionist') || isRole('master_admin');
    const canAdmit = isRole('nurse') || isRole('doctor') || isRole('master_admin');
    const canDischarge = isRole('nurse') || isRole('doctor') || isRole('master_admin');
    const canWritePrescription = isRole('therapeutic_staff') || isRole('doctor') || isRole('master_admin');
    const canUploadDiagnostic = isRole('diagnostic_staff') || isRole('lab_technician') || isRole('radiologist') || isRole('master_admin');
    const canChangeRole = isRole('master_admin');

    const fetchPatients = useCallback(async () => {
        try {
            const response = await api.get('/patients');
            console.log('Fetched patients:', response.data);
            setPatients(response.data);
        } catch (error) {
            showError('Failed to load patients');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchActiveAdmissions = useCallback(async () => {
        try {
            const response = await api.get('/admissions/active');
            setActiveAdmissions(response.data);
        } catch (error) {
            console.error('Failed to fetch admissions:', error);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
        fetchActiveAdmissions();
    }, [fetchPatients, fetchActiveAdmissions]);

    const handleRegisterPatient = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                patientDetails: {
                    contactNumber: formData.contactNumber,
                    emergencyContact: formData.emergencyContact
                }
            });
            showSuccess('Patient registered successfully');
            setShowRegisterForm(false);
            setFormData({
                username: '', email: '', password: '', contactNumber: '', emergencyContact: ''
            });
            fetchPatients();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to register patient');
        }
    };

    const handleAdmitPatient = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admissions', {
                patientId: selectedPatient.id,
                ...admissionData
            });
            showSuccess(`Patient ${selectedPatient.username} admitted successfully`);
            setShowAdmissionModal(false);
            setAdmissionData({ ward: '', bedNumber: '', reason: '', diagnosis: '', expectedStayDays: 1 });
            fetchPatients();
            fetchActiveAdmissions();
        } catch (error) {
            showError('Failed to admit patient');
        }
    };

    const handleDischargePatient = async (e) => {
        e.preventDefault();
        const admission = activeAdmissions.find(a => a.patient_id === selectedPatient.id);
        if (!admission) {
            showError('No active admission found for this patient');
            return;
        }
        
        try {
            await api.post(`/admissions/${admission.id}/discharge`, {
                dischargeNotes: dischargeData.notes,
                dischargeInstructions: dischargeData.instructions
            });
            showSuccess(`Patient ${selectedPatient.username} discharged successfully`);
            setShowDischargeModal(false);
            setDischargeData({ notes: '', instructions: '' });
            fetchPatients();
            fetchActiveAdmissions();
        } catch (error) {
            showError('Failed to discharge patient');
        }
    };

    const handleUploadDiagnostic = async (e) => {
        e.preventDefault();
        if (!diagnosticFile) {
            showError('Please select a file to upload');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', diagnosticFile);
        formData.append('patientId', selectedPatient.id);
        formData.append('recordType', diagnosticData.recordType);
        formData.append('testType', diagnosticData.testType);
        formData.append('description', diagnosticData.description);
        
        try {
            await api.post('/diagnostic/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Diagnostic file uploaded successfully');
            setShowDiagnosticModal(false);
            setDiagnosticFile(null);
            setDiagnosticData({ recordType: 'lab_result', testType: '', description: '' });
            fetchPatients();
        } catch (error) {
            showError('Failed to upload diagnostic file');
        }
    };

    const handleChangeRole = async () => {
        if (!selectedRole) {
            showError('Please select a role');
            return;
        }
        
        try {
            await api.put(`/master-admin/users/${selectedPatient.id}/role`, { role: selectedRole });
            showSuccess(`User role changed to ${getRoleDisplayName(selectedRole)}`);
            setShowRoleModal(false);
            setSelectedRole('');
            fetchPatients();
        } catch (error) {
            showError('Failed to change user role');
        }
    };

    const handlePrescribe = (e, patient) => {
        // Prevent default behavior
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setSelectedPatient(patient);
        setPrescriptionData({
            medication: '',
            dosage: '',
            frequency: '',
            duration: '',
            notes: '',
            refills: 0
        });
        setShowPrescribeModal(true);
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        
        if (!prescriptionData.medication || !prescriptionData.dosage) {
            showError('Medication and dosage are required');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post('/prescriptions', {
                patientId: selectedPatient.id,
                medication: prescriptionData.medication,
                dosage: prescriptionData.dosage,
                frequency: prescriptionData.frequency,
                duration: prescriptionData.duration,
                notes: prescriptionData.notes,
                refills: parseInt(prescriptionData.refills) || 0
            });
            showSuccess(`Prescription created for ${selectedPatient.username}`);
            setShowPrescribeModal(false);
            setPrescriptionData({
                medication: '',
                dosage: '',
                frequency: '',
                duration: '',
                notes: '',
                refills: 0
            });
            setSelectedPatient(null);
        } catch (error) {
            console.error('Error creating prescription:', error);
            showError(error.response?.data?.error || 'Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    const closePrescribeModal = () => {
        setShowPrescribeModal(false);
        setSelectedPatient(null);
        setPrescriptionData({
            medication: '',
            dosage: '',
            frequency: '',
            duration: '',
            notes: '',
            refills: 0
        });
    };

    const getRoleDisplayName = (role) => {
        const roleMap = {
            'master_admin': 'Master Admin',
            'doctor': 'Doctor',
            'nurse': 'Nurse',
            'patient': 'Patient',
            'receptionist': 'Receptionist',
            'pharmacist': 'Pharmacist',
            'lab_technician': 'Lab Technician',
            'radiologist': 'Radiologist',
            'diagnostic_staff': 'Diagnostic Staff',
            'therapeutic_staff': 'Therapeutic Staff',
            'ict_admin': 'ICT Admin'
        };
        return roleMap[role] || role;
    };

    const getVerificationBadge = (status) => {
        switch(status) {
            case 'approved':
                return <span className="status-badge verified">✓ Verified</span>;
            case 'pending':
                return <span className="status-badge pending">⏳ Pending</span>;
            case 'rejected':
                return <span className="status-badge rejected">✗ Rejected</span>;
            default:
                return <span className="status-badge active">✓ Active</span>;
        }
    };

    const isPatientAdmitted = (patientId) => {
        return activeAdmissions.some(a => a.patient_id === patientId);
    };

    if (loading) return <div className="loading">Loading patients...</div>;

    return (
        <div className="patient-management">
            <div className="management-header">
                <h2>Patient Management</h2>
                {canRegisterPatient && (
                    <button type="button" className="btn-primary" onClick={() => setShowRegisterForm(true)}>
                        + Register New Patient
                    </button>
                )}
            </div>

            {/* Patient Table */}
            <div className="patients-table-container">
                <table className="patients-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Health ID</th>
                            <th>Role</th>
                            <th>Verification</th>
                            <th>Status</th>
                            <th>Records</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(patient => (
                            <tr key={patient.id}>
                                <td className="patient-id">{patient.id}</td>
                                <td className="patient-name">
                                    <strong>{patient.username}</strong>
                                </td>
                                <td className="patient-email">{patient.email || '-'}</td>
                                <td className="patient-health-id">{patient.health_record_id}</td>
                                <td className="patient-role">
                                    <span className={`role-badge role-${patient.role}`}>
                                        {getRoleDisplayName(patient.role)}
                                    </span>
                                </td>
                                <td className="patient-verification">
                                    {getVerificationBadge(patient.verification_status)}
                                </td>
                                <td className="patient-status">
                                    <span className={`status-badge ${isPatientAdmitted(patient.id) ? 'admitted' : 'active'}`}>
                                        {isPatientAdmitted(patient.id) ? '🏥 Admitted' : '✅ Active'}
                                    </span>
                                </td>
                                <td className="patient-records">{patient.record_count || 0}</td>
                                <td className="patient-actions">
                                    <div className="action-buttons-group">
                                        {canChangeRole && (
                                            <button 
                                                type="button"
                                                className="action-btn role"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setSelectedRole(patient.role);
                                                    setShowRoleModal(true);
                                                }}
                                                title="Change Role"
                                            >
                                                🔄 Role
                                            </button>
                                        )}
                                        {canAdmit && !isPatientAdmitted(patient.id) && (
                                            <button 
                                                type="button"
                                                className="action-btn admit"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setShowAdmissionModal(true);
                                                }}
                                                title="Admit Patient"
                                            >
                                                🏥 Admit
                                            </button>
                                        )}
                                        {canDischarge && isPatientAdmitted(patient.id) && (
                                            <button 
                                                type="button"
                                                className="action-btn discharge"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setShowDischargeModal(true);
                                                }}
                                                title="Discharge Patient"
                                            >
                                                🚪 Discharge
                                            </button>
                                        )}
                                        {canWritePrescription && (
                                            <button 
                                                type="button"
                                                className="action-btn prescribe"
                                                onClick={(e) => handlePrescribe(e, patient)}
                                                title="Write Prescription"
                                            >
                                                💊 Prescribe
                                            </button>
                                        )}
                                        {canUploadDiagnostic && (
                                            <button 
                                                type="button"
                                                className="action-btn diagnostic"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setShowDiagnosticModal(true);
                                                }}
                                                title="Upload Results"
                                            >
                                                📎 Upload
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Modal */}
            {showRoleModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowRoleModal(false)}>×</button>
                        <h3>Change Role</h3>
                        <p>User: <strong>{selectedPatient.username}</strong></p>
                        <div className="form-group">
                            <label>Select New Role</label>
                            <select 
                                value={selectedRole} 
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="">Select a role...</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="nurse">Nurse</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="pharmacist">Pharmacist</option>
                                <option value="lab_technician">Lab Technician</option>
                                <option value="radiologist">Radiologist</option>
                                <option value="diagnostic_staff">Diagnostic Staff</option>
                                <option value="therapeutic_staff">Therapeutic Staff</option>
                                <option value="ict_admin">ICT Admin</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-success" onClick={handleChangeRole}>Update Role</button>
                            <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescribe Modal */}
            {showPrescribeModal && selectedPatient && (
                <div className="modal-overlay" onClick={closePrescribeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={closePrescribeModal}>×</button>
                        <h3>Create Prescription</h3>
                        <p className="modal-subtitle">Patient: <strong>{selectedPatient.username}</strong></p>
                        
                        <form onSubmit={handlePrescriptionSubmit}>
                            <div className="form-group">
                                <label>Medication Name *</label>
                                <input
                                    type="text"
                                    value={prescriptionData.medication}
                                    onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
                                    placeholder="e.g., Amoxicillin, Paracetamol"
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dosage *</label>
                                    <input
                                        type="text"
                                        value={prescriptionData.dosage}
                                        onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
                                        placeholder="e.g., 500mg, 10ml"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <input
                                        type="text"
                                        value={prescriptionData.frequency}
                                        onChange={(e) => setPrescriptionData({...prescriptionData, frequency: e.target.value})}
                                        placeholder="e.g., Twice daily, Every 8 hours"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        value={prescriptionData.duration}
                                        onChange={(e) => setPrescriptionData({...prescriptionData, duration: e.target.value})}
                                        placeholder="e.g., 7 days, 2 weeks"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Refills</label>
                                    <input
                                        type="number"
                                        value={prescriptionData.refills}
                                        onChange={(e) => setPrescriptionData({...prescriptionData, refills: parseInt(e.target.value) || 0})}
                                        min="0"
                                        max="10"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    value={prescriptionData.notes}
                                    onChange={(e) => setPrescriptionData({...prescriptionData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Special instructions, warnings, or notes for the patient..."
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Prescription'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={closePrescribeModal}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register Patient Modal */}
            {showRegisterForm && (
                <div className="modal-overlay" onClick={() => setShowRegisterForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowRegisterForm(false)}>×</button>
                        <h3>Register New Patient</h3>
                        <form onSubmit={handleRegisterPatient}>
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Emergency Contact</label>
                                <input
                                    type="tel"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success">Register</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowRegisterForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admission Modal */}
            {showAdmissionModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowAdmissionModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowAdmissionModal(false)}>×</button>
                        <h3>Admit Patient: {selectedPatient.username}</h3>
                        <form onSubmit={handleAdmitPatient}>
                            <div className="form-group">
                                <label>Ward *</label>
                                <select
                                    value={admissionData.ward}
                                    onChange={(e) => setAdmissionData({...admissionData, ward: e.target.value})}
                                    required
                                >
                                    <option value="">Select Ward</option>
                                    <option value="Medical">Medical Ward</option>
                                    <option value="Surgical">Surgical Ward</option>
                                    <option value="Pediatric">Pediatric Ward</option>
                                    <option value="Maternity">Maternity Ward</option>
                                    <option value="ICU">ICU</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Bed Number</label>
                                <input
                                    type="text"
                                    value={admissionData.bedNumber}
                                    onChange={(e) => setAdmissionData({...admissionData, bedNumber: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason for Admission</label>
                                <textarea
                                    value={admissionData.reason}
                                    onChange={(e) => setAdmissionData({...admissionData, reason: e.target.value})}
                                    rows="2"
                                    placeholder="Brief description of symptoms or reason for admission"
                                />
                            </div>
                            <div className="form-group">
                                <label>Initial Diagnosis</label>
                                <textarea
                                    value={admissionData.diagnosis}
                                    onChange={(e) => setAdmissionData({...admissionData, diagnosis: e.target.value})}
                                    rows="2"
                                    placeholder="Preliminary diagnosis"
                                />
                            </div>
                            <div className="form-group">
                                <label>Expected Stay (Days)</label>
                                <input
                                    type="number"
                                    value={admissionData.expectedStayDays}
                                    onChange={(e) => setAdmissionData({...admissionData, expectedStayDays: parseInt(e.target.value)})}
                                    min="1"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success">Admit Patient</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowAdmissionModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Discharge Modal */}
            {showDischargeModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowDischargeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowDischargeModal(false)}>×</button>
                        <h3>Discharge Patient: {selectedPatient.username}</h3>
                        <form onSubmit={handleDischargePatient}>
                            <div className="form-group">
                                <label>Discharge Notes</label>
                                <textarea
                                    value={dischargeData.notes}
                                    onChange={(e) => setDischargeData({...dischargeData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Summary of treatment and recovery..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Discharge Instructions</label>
                                <textarea
                                    value={dischargeData.instructions}
                                    onChange={(e) => setDischargeData({...dischargeData, instructions: e.target.value})}
                                    rows="3"
                                    placeholder="Follow-up care, medications, and restrictions..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-danger">Confirm Discharge</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowDischargeModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Diagnostic Upload Modal */}
            {showDiagnosticModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowDiagnosticModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowDiagnosticModal(false)}>×</button>
                        <h3>Upload Diagnostic Results for {selectedPatient.username}</h3>
                        <form onSubmit={handleUploadDiagnostic}>
                            <div className="form-group">
                                <label>Record Type</label>
                                <select
                                    value={diagnosticData.recordType}
                                    onChange={(e) => setDiagnosticData({...diagnosticData, recordType: e.target.value})}
                                >
                                    <option value="lab_result">Lab Result</option>
                                    <option value="imaging">Imaging (X-ray, MRI, CT)</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="general">General Report</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Test Type / Study</label>
                                <input
                                    type="text"
                                    value={diagnosticData.testType}
                                    onChange={(e) => setDiagnosticData({...diagnosticData, testType: e.target.value})}
                                    placeholder="e.g., Chest X-Ray, Complete Blood Count"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={diagnosticData.description}
                                    onChange={(e) => setDiagnosticData({...diagnosticData, description: e.target.value})}
                                    rows="3"
                                    placeholder="Findings, observations, or notes..."
                                />
                            </div>
                            <div className="form-group">
                                <label>File *</label>
                                <input
                                    type="file"
                                    onChange={(e) => setDiagnosticFile(e.target.files[0])}
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.dicom,.doc,.docx"
                                    required
                                />
                                <small>Supported: JPG, PNG, PDF, DICOM, DOC (Max 50MB)</small>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success">Upload</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowDiagnosticModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientManagementTable;