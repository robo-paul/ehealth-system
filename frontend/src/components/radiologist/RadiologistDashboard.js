// src/components/radiologist/RadiologistDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './RadiologistDashboard.css';

const RadiologistDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [patients, setPatients] = useState([]);
    const [imagingRequests, setImagingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploadData, setUploadData] = useState({
        patientId: '',
        testType: '',
        bodyPart: '',
        description: '',
        findings: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalStudies: 0,
        pendingReports: 0,
        completedStudies: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch patients
            const patientsRes = await api.get('/patients');
            setPatients(patientsRes.data || []);
            
            // Fetch imaging studies/requests
            const imagingRes = await api.get('/radiologist/imaging');
            setImagingRequests(imagingRes.data || []);
            
            // Calculate stats
            const pending = imagingRes.data?.filter(i => i.status === 'pending' || !i.report_completed) || [];
            const completed = imagingRes.data?.filter(i => i.status === 'completed' || i.report_completed) || [];
            
            setStats({
                totalStudies: imagingRes.data?.length || 0,
                pendingReports: pending.length,
                completedStudies: completed.length
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

    const filteredImaging = imagingRequests.filter(request =>
        request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.test_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.body_part?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUploadImaging = async (e) => {
        e.preventDefault();
        
        if (!uploadData.patientId || !selectedFile) {
            showError('Please select a patient and an image file');
            return;
        }
        
        setSubmitting(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('patientId', uploadData.patientId);
        formData.append('testType', uploadData.testType);
        formData.append('bodyPart', uploadData.bodyPart);
        formData.append('description', uploadData.description);
        formData.append('findings', uploadData.findings);
        
        try {
            await api.post('/radiologist/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Imaging study uploaded successfully');
            setShowUploadModal(false);
            setUploadData({
                patientId: '', testType: '', bodyPart: '', description: '', findings: ''
            });
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to upload imaging study');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateReport = async (imagingId, findings) => {
        try {
            await api.put(`/radiologist/imaging/${imagingId}/report`, { findings });
            showSuccess('Radiology report updated successfully');
            fetchData();
        } catch (error) {
            showError('Failed to update report');
        }
    };

    const handleViewImage = (image) => {
        setSelectedImage(image);
        setShowViewModal(true);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending':
                return <span className="status-badge pending">⏳ Pending Review</span>;
            case 'completed':
                return <span className="status-badge completed">✓ Report Completed</span>;
            case 'in_progress':
                return <span className="status-badge in-progress">🔄 In Progress</span>;
            default:
                return <span className="status-badge pending">{status}</span>;
        }
    };

    const getStudyTypeIcon = (type) => {
        const icons = {
            'X-Ray': '🩻',
            'CT': '📊',
            'MRI': '🧠',
            'Ultrasound': '🫀',
            'Mammogram': '🎯',
            'Fluoroscopy': '📽️'
        };
        return icons[type] || '📷';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="radiologist-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, Dr. {user?.username || 'Radiologist'}</h1>
                    <p>Manage imaging studies and radiology reports</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>
                    📷 + Upload Imaging Study
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📷</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalStudies}</div>
                        <div className="stat-label">Total Studies</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pendingReports}</div>
                        <div className="stat-label">Pending Reports</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.completedStudies}</div>
                        <div className="stat-label">Completed Studies</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search patients or imaging studies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Imaging Studies Section */}
            <div className="imaging-section">
                <h2>Imaging Studies & Reports</h2>
                <div className="imaging-table-container">
                    {filteredImaging.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📷</div>
                            <h3>No Imaging Studies Found</h3>
                            <p>{searchTerm ? 'No studies match your search.' : 'No imaging studies have been uploaded yet.'}</p>
                            <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>
                                + Upload First Study
                            </button>
                        </div>
                    ) : (
                        <table className="imaging-table">
                            <thead>
                                <tr>
                                    <th>Study Info</th>
                                    <th>Patient</th>
                                    <th>Test Type</th>
                                    <th>Body Part</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredImaging.map(study => (
                                    <tr key={study.id}>
                                        <td>
                                            <div className="study-info">
                                                <span className="study-id">ID: {study.id}</span>
                                                <span className="study-date">{new Date(study.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="patient-info">
                                                <strong>{study.patient_name}</strong>
                                                <span className="patient-id">ID: {study.patient_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="test-type">
                                                <span className="test-icon">{getStudyTypeIcon(study.test_type)}</span>
                                                <span>{study.test_type || 'General Study'}</span>
                                            </div>
                                        </td>
                                        <td>{study.body_part || 'Not specified'}</td>
                                        <td>{getStatusBadge(study.status)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {study.image_url && (
                                                    <button 
                                                        type="button"
                                                        className="btn-view"
                                                        onClick={() => handleViewImage(study)}
                                                    >
                                                        👁️ View
                                                    </button>
                                                )}
                                                <button 
                                                    type="button"
                                                    className="btn-report"
                                                    onClick={() => {
                                                        const findings = prompt('Enter radiology report findings:', study.findings || '');
                                                        if (findings !== null) {
                                                            handleUpdateReport(study.id, findings);
                                                        }
                                                    }}
                                                >
                                                    📝 {study.findings ? 'Edit Report' : 'Add Report'}
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

            {/* Patients Section */}
            <div className="patients-section">
                <h2>Patient List</h2>
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient Name</th>
                                <th>Health ID</th>
                                <th>Contact</th>
                                <th>Studies</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.slice(0, 20).map(patient => {
                                const patientStudies = imagingRequests.filter(i => i.patient_id === patient.id);
                                return (
                                    <tr key={patient.id}>
                                        <td>{patient.id}</td>
                                        <td>
                                            <strong>{patient.full_name || patient.username}</strong>
                                        </td>
                                        <td>{patient.health_record_id}</td>
                                        <td>{patient.contact_number || '-'}</td>
                                        <td className="studies-count">
                                            <span className="study-badge">{patientStudies.length} Studies</span>
                                        </td>
                                        <td>
                                            <button 
                                                type="button"
                                                className="btn-upload"
                                                onClick={() => {
                                                    setUploadData({...uploadData, patientId: patient.id});
                                                    setShowUploadModal(true);
                                                }}
                                            >
                                                📷 Upload Study
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Imaging Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                        <h3>Upload Imaging Study</h3>
                        <form onSubmit={handleUploadImaging}>
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
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="CT">CT Scan</option>
                                        <option value="MRI">MRI</option>
                                        <option value="Ultrasound">Ultrasound</option>
                                        <option value="Mammogram">Mammogram</option>
                                        <option value="Fluoroscopy">Fluoroscopy</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Body Part</label>
                                    <input
                                        type="text"
                                        value={uploadData.bodyPart}
                                        onChange={(e) => setUploadData({...uploadData, bodyPart: e.target.value})}
                                        placeholder="e.g., Chest, Knee, Brain"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Clinical Description</label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                                    rows="3"
                                    placeholder="Reason for study, clinical indications..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Image File *</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    accept=".jpg,.jpeg,.png,.gif,.dicom,.dcm"
                                    required
                                />
                                <small>Supported: JPG, PNG, GIF, DICOM (Max 50MB)</small>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Uploading...' : 'Upload Study'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Image Modal */}
            {showViewModal && selectedImage && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content image-viewer" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
                        <h3>Imaging Study Details</h3>
                        <div className="image-container">
                            {selectedImage.image_url ? (
                                <img 
                                    src={selectedImage.image_url} 
                                    alt="Imaging Study"
                                    className="medical-image"
                                />
                            ) : (
                                <div className="no-image">
                                    <span>🖼️</span>
                                    <p>Image preview not available</p>
                                </div>
                            )}
                        </div>
                        <div className="study-details">
                            <p><strong>Patient:</strong> {selectedImage.patient_name}</p>
                            <p><strong>Test Type:</strong> {selectedImage.test_type}</p>
                            <p><strong>Body Part:</strong> {selectedImage.body_part || 'Not specified'}</p>
                            <p><strong>Date:</strong> {new Date(selectedImage.created_at).toLocaleString()}</p>
                            {selectedImage.findings && (
                                <div className="findings-section">
                                    <strong>Radiology Report:</strong>
                                    <p>{selectedImage.findings}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowViewModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RadiologistDashboard;