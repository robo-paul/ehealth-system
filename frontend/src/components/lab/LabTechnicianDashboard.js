// src/components/lab/LabTechnicianDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './LabTechnicianDashboard.css';

const LabTechnicianDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [labRequests, setLabRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [uploadData, setUploadData] = useState({
        patientId: '',
        testType: '',
        sampleType: '',
        priority: 'normal',
        notes: '',
        results: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalTests: 0,
        pendingTests: 0,
        completedTests: 0,
        urgentTests: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch patients
            const patientsRes = await api.get('/patients');
            setPatients(patientsRes.data || []);
            
            // Fetch lab requests/tests
            const labRes = await api.get('/lab/requests');
            setLabRequests(labRes.data || []);
            
            // Calculate stats
            const pending = labRes.data?.filter(l => l.status === 'pending' || l.status === 'collected') || [];
            const completed = labRes.data?.filter(l => l.status === 'completed') || [];
            const urgent = labRes.data?.filter(l => l.priority === 'urgent' && l.status !== 'completed') || [];
            
            setStats({
                totalTests: labRes.data?.length || 0,
                pendingTests: pending.length,
                completedTests: completed.length,
                urgentTests: urgent.length
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

    const filteredRequests = labRequests.filter(request =>
        request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.test_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient_id?.toString().includes(searchTerm)
    );

    const handleCreateLabRequest = async (e) => {
        e.preventDefault();
        
        if (!uploadData.patientId || !uploadData.testType) {
            showError('Please select a patient and test type');
            return;
        }
        
        setSubmitting(true);
        const formData = new FormData();
        formData.append('patientId', uploadData.patientId);
        formData.append('testType', uploadData.testType);
        formData.append('sampleType', uploadData.sampleType);
        formData.append('priority', uploadData.priority);
        formData.append('notes', uploadData.notes);
        
        if (selectedFile) {
            formData.append('file', selectedFile);
        }
        
        try {
            await api.post('/lab/requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Lab request created successfully');
            setShowUploadModal(false);
            setUploadData({
                patientId: '', testType: '', sampleType: '', priority: 'normal', notes: '', results: ''
            });
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to create lab request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateResults = async (e) => {
        e.preventDefault();
        
        if (!selectedRequest || !uploadData.results) {
            showError('Please enter test results');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.put(`/lab/requests/${selectedRequest.id}/results`, {
                results: uploadData.results,
                status: 'completed'
            });
            showSuccess('Test results updated successfully');
            setShowResultModal(false);
            setSelectedRequest(null);
            setUploadData({
                ...uploadData,
                results: ''
            });
            fetchData();
        } catch (error) {
            showError('Failed to update results');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (requestId, status) => {
        try {
            await api.put(`/lab/requests/${requestId}/status`, { status });
            showSuccess(`Test status updated to ${status}`);
            fetchData();
        } catch (error) {
            showError('Failed to update status');
        }
    };

    const getStatusBadge = (status, priority) => {
        const statusConfig = {
            'pending': { class: 'pending', text: '⏳ Pending', icon: '🕐' },
            'collected': { class: 'collected', text: '📦 Sample Collected', icon: '📦' },
            'processing': { class: 'processing', text: '🔬 Processing', icon: '🔬' },
            'completed': { class: 'completed', text: '✓ Completed', icon: '✅' },
            'cancelled': { class: 'cancelled', text: '✗ Cancelled', icon: '❌' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        
        return (
            <div className="status-container">
                {priority === 'urgent' && status !== 'completed' && (
                    <span className="urgent-badge">⚠️ URGENT</span>
                )}
                <span className={`status-badge ${config.class}`}>
                    {config.icon} {config.text}
                </span>
            </div>
        );
    };

    const getTestTypeIcon = (type) => {
        const icons = {
            'Blood Test': '🩸',
            'Urine Test': '💧',
            'X-Ray': '🩻',
            'MRI': '🧠',
            'CT Scan': '📊',
            'Ultrasound': '🫀',
            'COVID Test': '🦠',
            'Biopsy': '🔬',
            'ECG': '📈',
            'Stool Test': '💩'
        };
        return icons[type] || '🧪';
    };

    const openResultModal = (request) => {
        setSelectedRequest(request);
        setUploadData({
            ...uploadData,
            results: request.results || ''
        });
        setShowResultModal(true);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading lab dashboard...</p>
            </div>
        );
    }

    return (
        <div className="lab-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, {user?.username || 'Lab Technician'}</h1>
                    <p>Manage laboratory tests and patient results</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>
                    🧪 + New Lab Request
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🧪</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalTests}</div>
                        <div className="stat-label">Total Tests</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pendingTests}</div>
                        <div className="stat-label">Pending Tests</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.completedTests}</div>
                        <div className="stat-label">Completed Tests</div>
                    </div>
                </div>
                <div className="stat-card urgent">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.urgentTests}</div>
                        <div className="stat-label">Urgent Tests</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search lab requests or patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Lab Requests Section */}
            <div className="lab-section">
                <h2>Laboratory Requests</h2>
                <div className="lab-table-container">
                    {filteredRequests.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🧪</div>
                            <h3>No Lab Requests Found</h3>
                            <p>{searchTerm ? 'No requests match your search.' : 'No lab requests have been created yet.'}</p>
                            <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>
                                + Create First Request
                            </button>
                        </div>
                    ) : (
                        <table className="lab-table">
                            <thead>
                                <tr>
                                    <th>Request ID</th>
                                    <th>Patient</th>
                                    <th>Test Type</th>
                                    <th>Sample Type</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Requested</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(request => (
                                    <tr key={request.id} className={request.priority === 'urgent' && request.status !== 'completed' ? 'urgent-row' : ''}>
                                        <td className="request-id">#{request.id}</td>
                                        <td>
                                            <div className="patient-info">
                                                <strong>{request.patient_name}</strong>
                                                <span className="patient-id-small">ID: {request.patient_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="test-type">
                                                <span className="test-icon">{getTestTypeIcon(request.test_type)}</span>
                                                <span>{request.test_type}</span>
                                            </div>
                                        </td>
                                        <td>{request.sample_type || 'Not specified'}</td>
                                        <td>
                                            {request.priority === 'urgent' ? (
                                                <span className="priority-urgent">⚠️ Urgent</span>
                                            ) : (
                                                <span className="priority-normal">Normal</span>
                                            )}
                                        </td>
                                        <td>{getStatusBadge(request.status, request.priority)}</td>
                                        <td className="request-date">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {request.status !== 'completed' && request.status !== 'cancelled' && (
                                                    <>
                                                        <select 
                                                            className="status-select"
                                                            value={request.status}
                                                            onChange={(e) => handleUpdateStatus(request.id, e.target.value)}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="collected">Sample Collected</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                        <button 
                                                            type="button"
                                                            className="btn-results"
                                                            onClick={() => openResultModal(request)}
                                                        >
                                                            📝 {request.results ? 'Edit Results' : 'Add Results'}
                                                        </button>
                                                    </>
                                                )}
                                                {request.results && (
                                                    <button 
                                                        type="button"
                                                        className="btn-view"
                                                        onClick={() => {
                                                            alert(`Results: ${request.results}`);
                                                        }}
                                                    >
                                                        👁️ View Results
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Patients Section */}
            <div className="patients-section">
                <h2>Patient Directory</h2>
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient Name</th>
                                <th>Health ID</th>
                                <th>Contact</th>
                                <th>Tests</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.slice(0, 20).map(patient => {
                                const patientTests = labRequests.filter(l => l.patient_id === patient.id);
                                const pendingTests = patientTests.filter(t => t.status !== 'completed');
                                return (
                                    <tr key={patient.id}>
                                        <td>{patient.id}</td>
                                        <td>
                                            <strong>{patient.full_name || patient.username}</strong>
                                        </td>
                                        <td>{patient.health_record_id}</td>
                                        <td>{patient.contact_number || '-'}</td>
                                        <td className="tests-count">
                                            <span className="test-badge">Total: {patientTests.length}</span>
                                            {pendingTests.length > 0 && (
                                                <span className="pending-badge-small">Pending: {pendingTests.length}</span>
                                            )}
                                        </td>
                                        <td>
                                            <button 
                                                type="button"
                                                className="btn-request"
                                                onClick={() => {
                                                    setUploadData({...uploadData, patientId: patient.id});
                                                    setShowUploadModal(true);
                                                }}
                                            >
                                                🧪 New Test
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Lab Request Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                        <h3>Create Lab Request</h3>
                        <form onSubmit={handleCreateLabRequest}>
                            <div className="form-group">
                                <label>Select Patient *</label>
                                <select
                                    value={uploadData.patientId}
                                    onChange={(e) => setUploadData({...uploadData, patientId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.full_name || patient.username} - {patient.health_record_id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Test Type *</label>
                                    <select
                                        value={uploadData.testType}
                                        onChange={(e) => setUploadData({...uploadData, testType: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Test Type</option>
                                        <option value="Blood Test">🩸 Blood Test</option>
                                        <option value="Urine Test">💧 Urine Test</option>
                                        <option value="COVID Test">🦠 COVID Test</option>
                                        <option value="Biopsy">🔬 Biopsy</option>
                                        <option value="ECG">📈 ECG</option>
                                        <option value="Stool Test">💩 Stool Test</option>
                                        <option value="Culture Test">🧫 Culture Test</option>
                                        <option value="Allergy Test">🤧 Allergy Test</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sample Type</label>
                                    <select
                                        value={uploadData.sampleType}
                                        onChange={(e) => setUploadData({...uploadData, sampleType: e.target.value})}
                                    >
                                        <option value="">Select Sample Type</option>
                                        <option value="Blood">Blood</option>
                                        <option value="Urine">Urine</option>
                                        <option value="Stool">Stool</option>
                                        <option value="Tissue">Tissue</option>
                                        <option value="Swab">Swab</option>
                                        <option value="Saliva">Saliva</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={uploadData.priority}
                                        onChange={(e) => setUploadData({...uploadData, priority: e.target.value})}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Clinical Notes</label>
                                <textarea
                                    value={uploadData.notes}
                                    onChange={(e) => setUploadData({...uploadData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Reason for test, clinical indications, doctor's notes..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Attachment (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                />
                                <small>Supported: JPG, PNG, PDF, DOC (Max 10MB)</small>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Lab Request'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Results Modal */}
            {showResultModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowResultModal(false)}>×</button>
                        <h3>Test Results</h3>
                        <div className="request-summary">
                            <p><strong>Patient:</strong> {selectedRequest.patient_name}</p>
                            <p><strong>Test Type:</strong> {selectedRequest.test_type}</p>
                            <p><strong>Sample Type:</strong> {selectedRequest.sample_type || 'Not specified'}</p>
                            <p><strong>Requested:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                        </div>
                        <form onSubmit={handleUpdateResults}>
                            <div className="form-group">
                                <label>Test Results *</label>
                                <textarea
                                    value={uploadData.results}
                                    onChange={(e) => setUploadData({...uploadData, results: e.target.value})}
                                    rows="6"
                                    placeholder="Enter test results, measurements, reference ranges, and any abnormal findings..."
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Results'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowResultModal(false)}>
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

export default LabTechnicianDashboard;