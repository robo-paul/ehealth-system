// frontend/src/components/HealthDashboard.js
import React, { useState, useEffect } from 'react';
import './HealthDashboard.css';

const HealthDashboard = ({ user, onLogout }) => {
    const [records, setRecords] = useState([]);
    const [newRecord, setNewRecord] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealthRecords();
    }, []);

    const fetchHealthRecords = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3001/api/health-records', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setLoading(false);
        }
    };

    const addHealthRecord = async () => {
        if (!newRecord.trim()) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3001/api/health-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    recordData: { 
                        text: newRecord,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                setNewRecord('');
                fetchHealthRecords();
            }
        } catch (error) {
            console.error('Failed to add record:', error);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Welcome, {user.username}!</h2>
                <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>

            <div className="user-info">
                <p>Health Record ID: {user.healthRecordId}</p>
            </div>

            <div className="add-record">
                <h3>Add Health Record</h3>
                <textarea
                    value={newRecord}
                    onChange={(e) => setNewRecord(e.target.value)}
                    placeholder="Enter health record details..."
                />
                <button onClick={addHealthRecord}>Add Record</button>
            </div>

            <div className="records-list">
                <h3>Your Health Records</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : records.length > 0 ? (
                    records.map(record => (
                        <div key={record.id} className="record-card">
                            <p className="record-date">
                                {new Date(record.created_at).toLocaleString()}
                            </p>
                            <p className="record-data">
                                {JSON.parse(record.record_data).text}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No health records found</p>
                )}
            </div>
        </div>
    );
};

export default HealthDashboard;