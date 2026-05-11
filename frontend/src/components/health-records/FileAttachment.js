// src/components/health-records/FileAttachment.js
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import healthRecordService from '../../services/healthRecordService';
import './FileAttachment.css';

const FileAttachment = ({ recordId, attachments, onAttachmentChange }) => {
    const { showSuccess, showError } = useToast();
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                showError('File size must be less than 10MB');
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                showError('Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, TXT');
                return;
            }
            
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('recordData', JSON.stringify({}));
            
            await healthRecordService.createRecordWithFile({}, selectedFile);
            showSuccess('File uploaded successfully');
            setSelectedFile(null);
            onAttachmentChange();
        } catch (error) {
            showError('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            const blob = await healthRecordService.downloadAttachment(attachment.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.file_name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            showError('Failed to download file');
        }
    };

    const handleDelete = async (attachmentId) => {
        if (window.confirm('Are you sure you want to delete this attachment?')) {
            try {
                await healthRecordService.deleteAttachment(attachmentId);
                showSuccess('Attachment deleted successfully');
                onAttachmentChange();
            } catch (error) {
                showError('Failed to delete attachment');
            }
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType === 'application/pdf') return '📄';
        if (fileType.includes('word')) return '📝';
        if (fileType === 'text/plain') return '📃';
        return '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="file-attachment">
            <div className="attachment-header">
                <h4>Attachments</h4>
                <div className="upload-section">
                    <input
                        type="file"
                        id={`file-upload-${recordId}`}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                    />
                    <label 
                        htmlFor={`file-upload-${recordId}`} 
                        className="upload-btn"
                    >
                        📎 Upload File
                    </label>
                    {selectedFile && (
                        <div className="selected-file">
                            <span>{selectedFile.name}</span>
                            <button 
                                onClick={handleUpload} 
                                className="confirm-upload"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Confirm'}
                            </button>
                            <button 
                                onClick={() => setSelectedFile(null)} 
                                className="cancel-upload"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {attachments && attachments.length > 0 ? (
                <div className="attachments-list">
                    {attachments.map(attachment => (
                        <div key={attachment.id} className="attachment-item">
                            <div className="attachment-icon">
                                {getFileIcon(attachment.file_type)}
                            </div>
                            <div className="attachment-info">
                                <div className="attachment-name">{attachment.file_name}</div>
                                <div className="attachment-meta">
                                    <span>{formatFileSize(attachment.file_size)}</span>
                                    <span>•</span>
                                    <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                                    {attachment.description && (
                                        <>
                                            <span>•</span>
                                            <span>{attachment.description}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="attachment-actions">
                                <button 
                                    onClick={() => handleDownload(attachment)}
                                    className="download-btn"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                <button 
                                    onClick={() => handleDelete(attachment.id)}
                                    className="delete-attachment-btn"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-attachments">
                    <p>No attachments yet. Click "Upload File" to add documents, images, or lab results.</p>
                </div>
            )}
        </div>
    );
};

export default FileAttachment;