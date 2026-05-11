// src/pages/admin/RoleRequestsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './AdminPages.css';

const RoleRequestsPage = () => {
    const { showSuccess, showError } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/master-admin/role-requests/pending');
            setRequests(response.data);
        } catch (error) {
            showError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (requestId) => {
        try {
            await api.post(`/master-admin/role-requests/${requestId}/approve`);
            showSuccess('Role request approved successfully');
            fetchRequests();
            setSelectedRequest(null);
        } catch (error) {
            showError('Failed to approve request');
        }
    };

    const handleReject = async (requestId) => {
        if (!rejectionReason) {
            showError('Please provide a rejection reason');
            return;
        }
        
        try {
            await api.post(`/master-admin/role-requests/${requestId}/reject`, { rejectionReason });
            showSuccess('Role request rejected');
            fetchRequests();
            setSelectedRequest(null);
            setRejectionReason('');
        } catch (error) {
            showError('Failed to reject request');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending':
                return <span className="badge-warning">Pending</span>;
            case 'approved':
                return <span className="badge-success">Approved</span>;
            case 'rejected':
                return <span className="badge-danger">Rejected</span>;
            default:
                return <span className="badge-secondary">{status}</span>;
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-page">
            <h1>Role Requests</h1>
            
            {requests.length === 0 ? (
                <div className="empty-state">
                    <p>No pending role requests</p>
                </div>
            ) : (
                <div className="requests-list">
                    {requests.map(request => (
                        <div key={request.id} className="request-card">
                            <div className="request-header">
                                <h3>{request.username}</h3>
                                {getStatusBadge(request.status)}
                            </div>
                            <div className="request-details">
                                <p><strong>Requested Role:</strong> {request.requested_role.replace('_', ' ').toUpperCase()}</p>
                                <p><strong>Email:</strong> {request.email}</p>
                                <p><strong>Health Record ID:</strong> {request.health_record_id}</p>
                                {request.reason && (
                                    <p><strong>Reason:</strong> {request.reason}</p>
                                )}
                                <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleString()}</p>
                                {request.documents && request.documents !== '[]' && (
                                    <div className="documents">
                                        <strong>Documents:</strong>
                                        <ul>
                                            {JSON.parse(request.documents).map((doc, idx) => (
                                                <li key={idx}>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                        {doc.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="request-actions">
                                <button 
                                    className="btn-success"
                                    onClick={() => handleApprove(request.id)}
                                >
                                    Approve
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rejection Modal */}
            {selectedRequest && (
                <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Reject Role Request</h3>
                        <p>User: <strong>{selectedRequest.username}</strong></p>
                        <p>Requested Role: <strong>{selectedRequest.requested_role}</strong></p>
                        
                        <div className="form-group">
                            <label>Rejection Reason *</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows="4"
                                placeholder="Please provide a reason for rejection..."
                                required
                            />
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn-danger"
                                onClick={() => handleReject(selectedRequest.id)}
                            >
                                Confirm Rejection
                            </button>
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleRequestsPage;