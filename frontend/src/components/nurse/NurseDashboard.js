// src/components/nurse/NurseDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './NurseDashboard.css';

const NurseDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [vitalsData, setVitalsData] = useState({
        temperature: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        notes: ''
    });
    const [medicationData, setMedicationData] = useState({
        medication: '',
        dosage: '',
        route: 'oral',
        frequency: '',
        administeredAt: '',
        notes: ''
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
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalPatients: 0,
        admittedToday: 0,
        pendingDischarge: 0,
        criticalPatients: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch all patients
            const patientsRes = await api.get('/patients');
            setPatients(patientsRes.data || []);
            
            // Fetch admitted patients
            const admittedRes = await api.get('/admissions/active');
            setAdmittedPatients(admittedRes.data || []);
            
            // Calculate stats
            const today = new Date().toISOString().split('T')[0];
            const admittedToday = admittedRes.data?.filter(a => a.admitted_at?.split('T')[0] === today) || [];
            const critical = admittedRes.data?.filter(a => a.critical_status === true) || [];
            
            setStats({
                totalPatients: patientsRes.data?.length || 0,
                admittedToday: admittedToday.length,
                pendingDischarge: admittedRes.data?.length || 0,
                criticalPatients: critical.length
            });
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPatients = patients.filter(patient =>
        patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.full_name && patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.health_record_id && patient.health_record_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredAdmitted = admittedPatients.filter(admission =>
        admission.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.ward?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRecordVitals = async (e) => {
        e.preventDefault();
        
        if (!vitalsData.temperature || !vitalsData.bloodPressureSystolic || !vitalsData.heartRate) {
            showError('Please record at least temperature, blood pressure, and heart rate');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post(`/nurse/patients/${selectedPatient.id}/vitals`, {
                temperature: vitalsData.temperature,
                bloodPressure: `${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}`,
                heartRate: vitalsData.heartRate,
                respiratoryRate: vitalsData.respiratoryRate,
                oxygenSaturation: vitalsData.oxygenSaturation,
                weight: vitalsData.weight,
                height: vitalsData.height,
                notes: vitalsData.notes
            });
            showSuccess(`Vitals recorded for ${selectedPatient.username}`);
            setShowVitalsModal(false);
            setVitalsData({
                temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '',
                heartRate: '', respiratoryRate: '', oxygenSaturation: '',
                weight: '', height: '', notes: ''
            });
            fetchData();
        } catch (error) {
            showError('Failed to record vitals');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdministerMedication = async (e) => {
        e.preventDefault();
        
        if (!medicationData.medication || !medicationData.dosage) {
            showError('Please enter medication and dosage');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post(`/nurse/patients/${selectedPatient.id}/medications`, {
                medication: medicationData.medication,
                dosage: medicationData.dosage,
                route: medicationData.route,
                frequency: medicationData.frequency,
                administeredAt: medicationData.administeredAt || new Date().toISOString(),
                notes: medicationData.notes
            });
            showSuccess(`Medication administered to ${selectedPatient.username}`);
            setShowMedicationModal(false);
            setMedicationData({
                medication: '', dosage: '', route: 'oral', frequency: '', administeredAt: '', notes: ''
            });
            fetchData();
        } catch (error) {
            showError('Failed to record medication');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdmitPatient = async (e) => {
        e.preventDefault();
        
        setSubmitting(true);
        try {
            await api.post('/admissions', {
                patientId: selectedPatient.id,
                ward: admissionData.ward,
                bedNumber: admissionData.bedNumber,
                reason: admissionData.reason,
                diagnosis: admissionData.diagnosis,
                expectedStayDays: admissionData.expectedStayDays
            });
            showSuccess(`Patient ${selectedPatient.username} admitted to ${admissionData.ward} Ward`);
            setShowAdmissionModal(false);
            setAdmissionData({ ward: '', bedNumber: '', reason: '', diagnosis: '', expectedStayDays: 1 });
            fetchData();
        } catch (error) {
            showError('Failed to admit patient');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischargePatient = async (e) => {
        e.preventDefault();
        
        const admission = admittedPatients.find(a => a.patient_id === selectedPatient.id);
        if (!admission) {
            showError('No active admission found for this patient');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post(`/admissions/${admission.id}/discharge`, {
                dischargeNotes: dischargeData.notes,
                dischargeInstructions: dischargeData.instructions
            });
            showSuccess(`Patient ${selectedPatient.username} discharged successfully`);
            setShowDischargeModal(false);
            setDischargeData({ notes: '', instructions: '' });
            fetchData();
        } catch (error) {
            showError('Failed to discharge patient');
        } finally {
            setSubmitting(false);
        }
    };

    const getAdmissionStatusBadge = (status) => {
        switch(status) {
            case 'admitted':
                return <span className="status-badge admitted">🏥 Admitted</span>;
            case 'discharged':
                return <span className="status-badge discharged">✅ Discharged</span>;
            default:
                return <span className="status-badge active">✓ Active</span>;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading nurse dashboard...</p>
            </div>
        );
    }

    return (
        <div className="nurse-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, {user?.username || 'Nurse'}</h1>
                    <p>Manage patient care, vitals, and admissions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalPatients}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏥</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.admittedToday}</div>
                        <div className="stat-label">Admitted Today</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pendingDischarge}</div>
                        <div className="stat-label">Currently Admitted</div>
                    </div>
                </div>
                <div className="stat-card critical">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.criticalPatients}</div>
                        <div className="stat-label">Critical Patients</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search patients or wards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Currently Admitted Patients Section */}
            <div className="admitted-section">
                <h2>Currently Admitted Patients</h2>
                <div className="admitted-table-container">
                    {filteredAdmitted.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🏥</div>
                            <h3>No Admitted Patients</h3>
                            <p>No patients are currently admitted to the hospital.</p>
                        </div>
                    ) : (
                        <table className="admitted-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Ward</th>
                                    <th>Bed</th>
                                    <th>Admitted On</th>
                                    <th>Diagnosis</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAdmitted.map(admission => (
                                    <tr key={admission.id} className={admission.critical_status ? 'critical-row' : ''}>
                                        <td className="patient-name">
                                            <strong>{admission.patient_name}</strong>
                                            <span className="patient-id-small">ID: {admission.patient_id}</span>
                                        </td>
                                        <td className="ward-info">
                                            <span className="ward-icon">🏥</span>
                                            {admission.ward} Ward
                                        </td>
                                        <td>{admission.bed_number || 'Not assigned'}</td>
                                        <td>{new Date(admission.admitted_at).toLocaleDateString()}</td>
                                        <td className="diagnosis-text">{admission.diagnosis || 'Pending'}</td>
                                        <td>{getAdmissionStatusBadge(admission.status)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    type="button"
                                                    className="btn-vitals"
                                                    onClick={() => {
                                                        setSelectedPatient({ id: admission.patient_id, username: admission.patient_name });
                                                        setShowVitalsModal(true);
                                                    }}
                                                >
                                                    📊 Record Vitals
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="btn-medication"
                                                    onClick={() => {
                                                        setSelectedPatient({ id: admission.patient_id, username: admission.patient_name });
                                                        setShowMedicationModal(true);
                                                    }}
                                                >
                                                    💊 Administer
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="btn-discharge"
                                                    onClick={() => {
                                                        setSelectedPatient({ id: admission.patient_id, username: admission.patient_name });
                                                        setShowDischargeModal(true);
                                                    }}
                                                >
                                                    🚪 Discharge
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* All Patients Section */}
            <div className="patients-section">
                <h2>All Patients</h2>
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient Name</th>
                                <th>Health ID</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.slice(0, 20).map(patient => {
                                const isAdmitted = admittedPatients.some(a => a.patient_id === patient.id);
                                return (
                                    <tr key={patient.id}>
                                        <td className="patient-id">{patient.id}</td>
                                        <td className="patient-name">
                                            <strong>{patient.full_name || patient.username}</strong>
                                        </td>
                                        <td className="health-id">{patient.health_record_id}</td>
                                        <td className="contact">{patient.contact_number || '-'}</td>
                                        <td className="status">
                                            {isAdmitted ? (
                                                <span className="status-badge admitted">🏥 Admitted</span>
                                            ) : (
                                                <span className="status-badge active">✓ Active</span>
                                            )}
                                        </td>
                                        <td className="actions">
                                            <div className="action-buttons">
                                                {!isAdmitted && (
                                                    <button 
                                                        type="button"
                                                        className="btn-admit"
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setShowAdmissionModal(true);
                                                        }}
                                                    >
                                                        🏥 Admit
                                                    </button>
                                                )}
                                                <button 
                                                    type="button"
                                                    className="btn-vitals"
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setShowVitalsModal(true);
                                                    }}
                                                >
                                                    📊 Vitals
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Vitals Modal */}
            {showVitalsModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowVitalsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowVitalsModal(false)}>×</button>
                        <h3>Record Patient Vitals</h3>
                        <p className="modal-subtitle">Patient: <strong>{selectedPatient.username}</strong></p>
                        
                        <form onSubmit={handleRecordVitals}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Temperature (°C) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vitalsData.temperature}
                                        onChange={(e) => setVitalsData({...vitalsData, temperature: e.target.value})}
                                        placeholder="e.g., 36.5"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Blood Pressure (Systolic) *</label>
                                    <input
                                        type="number"
                                        value={vitalsData.bloodPressureSystolic}
                                        onChange={(e) => setVitalsData({...vitalsData, bloodPressureSystolic: e.target.value})}
                                        placeholder="e.g., 120"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Blood Pressure (Diastolic)</label>
                                    <input
                                        type="number"
                                        value={vitalsData.bloodPressureDiastolic}
                                        onChange={(e) => setVitalsData({...vitalsData, bloodPressureDiastolic: e.target.value})}
                                        placeholder="e.g., 80"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Heart Rate (bpm) *</label>
                                    <input
                                        type="number"
                                        value={vitalsData.heartRate}
                                        onChange={(e) => setVitalsData({...vitalsData, heartRate: e.target.value})}
                                        placeholder="e.g., 72"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Respiratory Rate</label>
                                    <input
                                        type="number"
                                        value={vitalsData.respiratoryRate}
                                        onChange={(e) => setVitalsData({...vitalsData, respiratoryRate: e.target.value})}
                                        placeholder="breaths/min"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Oxygen Saturation (%)</label>
                                    <input
                                        type="number"
                                        value={vitalsData.oxygenSaturation}
                                        onChange={(e) => setVitalsData({...vitalsData, oxygenSaturation: e.target.value})}
                                        placeholder="e.g., 98"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vitalsData.weight}
                                        onChange={(e) => setVitalsData({...vitalsData, weight: e.target.value})}
                                        placeholder="e.g., 70.5"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Height (cm)</label>
                                    <input
                                        type="number"
                                        value={vitalsData.height}
                                        onChange={(e) => setVitalsData({...vitalsData, height: e.target.value})}
                                        placeholder="e.g., 170"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={vitalsData.notes}
                                    onChange={(e) => setVitalsData({...vitalsData, notes: e.target.value})}
                                    rows="2"
                                    placeholder="Additional observations or notes..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Vitals'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowVitalsModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Administer Medication Modal */}
            {showMedicationModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowMedicationModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowMedicationModal(false)}>×</button>
                        <h3>Administer Medication</h3>
                        <p className="modal-subtitle">Patient: <strong>{selectedPatient.username}</strong></p>
                        
                        <form onSubmit={handleAdministerMedication}>
                            <div className="form-group">
                                <label>Medication *</label>
                                <input
                                    type="text"
                                    value={medicationData.medication}
                                    onChange={(e) => setMedicationData({...medicationData, medication: e.target.value})}
                                    placeholder="e.g., Paracetamol, Amoxicillin"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dosage *</label>
                                    <input
                                        type="text"
                                        value={medicationData.dosage}
                                        onChange={(e) => setMedicationData({...medicationData, dosage: e.target.value})}
                                        placeholder="e.g., 500mg"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Route</label>
                                    <select
                                        value={medicationData.route}
                                        onChange={(e) => setMedicationData({...medicationData, route: e.target.value})}
                                    >
                                        <option value="oral">Oral</option>
                                        <option value="intravenous">Intravenous (IV)</option>
                                        <option value="intramuscular">Intramuscular (IM)</option>
                                        <option value="subcutaneous">Subcutaneous</option>
                                        <option value="topical">Topical</option>
                                        <option value="inhalation">Inhalation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <input
                                        type="text"
                                        value={medicationData.frequency}
                                        onChange={(e) => setMedicationData({...medicationData, frequency: e.target.value})}
                                        placeholder="e.g., Twice daily, Every 6 hours"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Time Administered</label>
                                    <input
                                        type="datetime-local"
                                        value={medicationData.administeredAt}
                                        onChange={(e) => setMedicationData({...medicationData, administeredAt: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={medicationData.notes}
                                    onChange={(e) => setMedicationData({...medicationData, notes: e.target.value})}
                                    rows="2"
                                    placeholder="Any observations or reactions..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Recording...' : 'Record Administration'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowMedicationModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admit Patient Modal */}
            {showAdmissionModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowAdmissionModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowAdmissionModal(false)}>×</button>
                        <h3>Admit Patient</h3>
                        <p>Patient: <strong>{selectedPatient.username}</strong></p>
                        
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
                                    <option value="Cardiology">Cardiology Ward</option>
                                    <option value="Neurology">Neurology Ward</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Bed Number</label>
                                <input
                                    type="text"
                                    value={admissionData.bedNumber}
                                    onChange={(e) => setAdmissionData({...admissionData, bedNumber: e.target.value})}
                                    placeholder="e.g., Bed 12A"
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason for Admission</label>
                                <textarea
                                    value={admissionData.reason}
                                    onChange={(e) => setAdmissionData({...admissionData, reason: e.target.value})}
                                    rows="2"
                                    placeholder="Reason for admission..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Initial Diagnosis</label>
                                <textarea
                                    value={admissionData.diagnosis}
                                    onChange={(e) => setAdmissionData({...admissionData, diagnosis: e.target.value})}
                                    rows="2"
                                    placeholder="Preliminary diagnosis..."
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
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Admitting...' : 'Admit Patient'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowAdmissionModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Discharge Patient Modal */}
            {showDischargeModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowDischargeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowDischargeModal(false)}>×</button>
                        <h3>Discharge Patient</h3>
                        <p>Patient: <strong>{selectedPatient.username}</strong></p>
                        
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
                                <button type="submit" className="btn-danger" disabled={submitting}>
                                    {submitting ? 'Processing...' : 'Confirm Discharge'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowDischargeModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseDashboard;