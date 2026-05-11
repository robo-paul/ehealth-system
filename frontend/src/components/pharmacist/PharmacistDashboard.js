// src/components/pharmacist/PharmacistDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './PharmacistDashboard.css';

const PharmacistDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [prescriptions, setPrescriptions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [showDispenseModal, setShowDispenseModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState(null);
    const [dispenseData, setDispenseData] = useState({
        quantity: 1,
        notes: ''
    });
    const [inventoryData, setInventoryData] = useState({
        medicationName: '',
        quantity: 0,
        unit: 'tablets',
        price: 0,
        expiryDate: '',
        manufacturer: '',
        requiresPrescription: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalPrescriptions: 0,
        pendingDispense: 0,
        dispensedToday: 0,
        lowStockItems: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch prescriptions
            const prescriptionsRes = await api.get('/pharmacist/prescriptions');
            setPrescriptions(prescriptionsRes.data || []);
            
            // Fetch inventory
            const inventoryRes = await api.get('/pharmacist/inventory');
            setInventory(inventoryRes.data || []);
            
            // Calculate stats
            const pending = prescriptionsRes.data?.filter(p => p.status === 'prescribed') || [];
            const today = new Date().toISOString().split('T')[0];
            const dispensedToday = prescriptionsRes.data?.filter(p => p.dispensed_at && p.dispensed_at.split('T')[0] === today) || [];
            const lowStock = inventoryRes.data?.filter(i => i.quantity < (i.min_stock_threshold || 10)) || [];
            
            setStats({
                totalPrescriptions: prescriptionsRes.data?.length || 0,
                pendingDispense: pending.length,
                dispensedToday: dispensedToday.length,
                lowStockItems: lowStock.length
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

    const filteredPrescriptions = prescriptions.filter(prescription =>
        prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medication?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInventory = inventory.filter(item =>
        item.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDispense = async (e) => {
        e.preventDefault();
        
        if (!dispenseData.quantity || dispenseData.quantity < 1) {
            showError('Please enter a valid quantity');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post(`/pharmacist/prescriptions/${selectedPrescription.id}/dispense`, {
                dispensedQuantity: dispenseData.quantity,
                notes: dispenseData.notes
            });
            showSuccess(`Prescription dispensed successfully`);
            setShowDispenseModal(false);
            setSelectedPrescription(null);
            setDispenseData({ quantity: 1, notes: '' });
            fetchData();
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to dispense prescription');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddInventory = async (e) => {
        e.preventDefault();
        
        if (!inventoryData.medicationName || inventoryData.quantity <= 0) {
            showError('Please enter medication name and valid quantity');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post('/pharmacist/inventory', inventoryData);
            showSuccess(`Medication added to inventory`);
            setShowInventoryModal(false);
            setInventoryData({
                medicationName: '',
                quantity: 0,
                unit: 'tablets',
                price: 0,
                expiryDate: '',
                manufacturer: '',
                requiresPrescription: true
            });
            fetchData();
        } catch (error) {
            showError('Failed to add medication');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        
        if (!selectedMedication || !dispenseData.quantity || dispenseData.quantity <= 0) {
            showError('Please enter a valid quantity to add');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.put(`/pharmacist/inventory/${selectedMedication.id}/restock`, {
                quantity: parseInt(dispenseData.quantity)
            });
            showSuccess(`Inventory updated successfully`);
            setShowRestockModal(false);
            setSelectedMedication(null);
            setDispenseData({ quantity: 1, notes: '' });
            fetchData();
        } catch (error) {
            showError('Failed to update inventory');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'prescribed':
                return <span className="status-badge prescribed">📝 Prescribed</span>;
            case 'dispensed':
                return <span className="status-badge dispensed">✅ Dispensed</span>;
            case 'cancelled':
                return <span className="status-badge cancelled">✗ Cancelled</span>;
            case 'partial':
                return <span className="status-badge partial">🔄 Partial</span>;
            default:
                return <span className="status-badge pending">⏳ Pending</span>;
        }
    };

    const getStockStatus = (quantity, minThreshold) => {
        const threshold = minThreshold || 10;
        if (quantity <= 0) return <span className="stock-out">Out of Stock</span>;
        if (quantity <= threshold) return <span className="stock-low">Low Stock</span>;
        return <span className="stock-ok">In Stock</span>;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading pharmacy dashboard...</p>
            </div>
        );
    }

    return (
        <div className="pharmacist-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, {user?.username || 'Pharmacist'}</h1>
                    <p>Manage prescriptions and pharmacy inventory</p>
                </div>
                <div className="header-actions">
                    <button type="button" className="btn-primary" onClick={() => setShowInventoryModal(true)}>
                        📦 + Add Medication
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.totalPrescriptions}</div>
                        <div className="stat-label">Total Prescriptions</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pendingDispense}</div>
                        <div className="stat-label">Pending Dispense</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.dispensedToday}</div>
                        <div className="stat-label">Dispensed Today</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.lowStockItems}</div>
                        <div className="stat-label">Low Stock Items</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search prescriptions or medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Prescriptions Section */}
            <div className="prescriptions-section">
                <h2>Prescriptions to Process</h2>
                <div className="prescriptions-table-container">
                    {filteredPrescriptions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>No Prescriptions Found</h3>
                            <p>{searchTerm ? 'No prescriptions match your search.' : 'No pending prescriptions to process.'}</p>
                        </div>
                    ) : (
                        <table className="prescriptions-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Medication</th>
                                    <th>Dosage</th>
                                    <th>Doctor</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrescriptions.map(prescription => (
                                    <tr key={prescription.id}>
                                        <td className="prescription-date">
                                            {new Date(prescription.prescribed_date).toLocaleDateString()}
                                        </td>
                                        <td className="patient-name">
                                            <strong>{prescription.patient_name}</strong>
                                            <span className="patient-id-small">ID: {prescription.patient_id}</span>
                                        </td>
                                        <td className="medication-name">
                                            <span className="medication-icon">💊</span>
                                            {prescription.medication}
                                        </td>
                                        <td className="dosage-info">
                                            {prescription.dosage}
                                            {prescription.frequency && (
                                                <span className="frequency-small">{prescription.frequency}</span>
                                            )}
                                        </td>
                                        <td>Dr. {prescription.doctor_name}</td>
                                        <td>{getStatusBadge(prescription.status)}</td>
                                        <td>
                                            {prescription.status === 'prescribed' && (
                                                <button 
                                                    type="button"
                                                    className="btn-dispense"
                                                    onClick={() => {
                                                        setSelectedPrescription(prescription);
                                                        setShowDispenseModal(true);
                                                    }}
                                                >
                                                    💊 Dispense
                                                </button>
                                            )}
                                            {prescription.status === 'dispensed' && (
                                                <span className="dispensed-label">✓ Dispensed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Inventory Section */}
            <div className="inventory-section">
                <h2>Pharmacy Inventory</h2>
                <div className="inventory-table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Medication</th>
                                <th>Manufacturer</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Price</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map(item => (
                                <tr key={item.id} className={item.quantity <= (item.min_stock_threshold || 10) ? 'low-stock-row' : ''}>
                                    <td className="medication-name">
                                        <strong>{item.medication_name}</strong>
                                    </td>
                                    <td>{item.manufacturer || '-'}</td>
                                    <td className="quantity-cell">
                                        <span className={`quantity ${item.quantity <= (item.min_stock_threshold || 10) ? 'low' : ''}`}>
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td>{item.unit}</td>
                                    <td>${item.price?.toFixed(2) || '0.00'}</td>
                                    <td className={item.expiry_date && new Date(item.expiry_date) < new Date() ? 'expired' : ''}>
                                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>{getStockStatus(item.quantity, item.min_stock_threshold)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                type="button"
                                                className="btn-restock"
                                                onClick={() => {
                                                    setSelectedMedication(item);
                                                    setDispenseData({ quantity: 1, notes: '' });
                                                    setShowRestockModal(true);
                                                }}
                                            >
                                                📦 Restock
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispense Modal */}
            {showDispenseModal && selectedPrescription && (
                <div className="modal-overlay" onClick={() => setShowDispenseModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowDispenseModal(false)}>×</button>
                        <h3>Dispense Medication</h3>
                        <div className="prescription-summary">
                            <p><strong>Patient:</strong> {selectedPrescription.patient_name}</p>
                            <p><strong>Medication:</strong> {selectedPrescription.medication}</p>
                            <p><strong>Dosage:</strong> {selectedPrescription.dosage}</p>
                            <p><strong>Prescribed by:</strong> Dr. {selectedPrescription.doctor_name}</p>
                            {selectedPrescription.notes && (
                                <p><strong>Doctor's Notes:</strong> {selectedPrescription.notes}</p>
                            )}
                        </div>
                        <form onSubmit={handleDispense}>
                            <div className="form-group">
                                <label>Quantity to Dispense *</label>
                                <input
                                    type="number"
                                    value={dispenseData.quantity}
                                    onChange={(e) => setDispenseData({...dispenseData, quantity: parseInt(e.target.value) || 0})}
                                    min="1"
                                    required
                                />
                                <small>Default quantity: 1 month supply</small>
                            </div>
                            <div className="form-group">
                                <label>Pharmacist Notes</label>
                                <textarea
                                    value={dispenseData.notes}
                                    onChange={(e) => setDispenseData({...dispenseData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Instructions for patient, warnings, or additional notes..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Processing...' : 'Confirm Dispense'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowDispenseModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Inventory Modal */}
            {showInventoryModal && (
                <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowInventoryModal(false)}>×</button>
                        <h3>Add Medication to Inventory</h3>
                        <form onSubmit={handleAddInventory}>
                            <div className="form-group">
                                <label>Medication Name *</label>
                                <input
                                    type="text"
                                    value={inventoryData.medicationName}
                                    onChange={(e) => setInventoryData({...inventoryData, medicationName: e.target.value})}
                                    placeholder="e.g., Amoxicillin, Paracetamol"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        value={inventoryData.quantity}
                                        onChange={(e) => setInventoryData({...inventoryData, quantity: parseInt(e.target.value) || 0})}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select
                                        value={inventoryData.unit}
                                        onChange={(e) => setInventoryData({...inventoryData, unit: e.target.value})}
                                    >
                                        <option value="tablets">Tablets</option>
                                        <option value="capsules">Capsules</option>
                                        <option value="ml">ml (Liquid)</option>
                                        <option value="mg">mg</option>
                                        <option value="injection">Injection</option>
                                        <option value="cream">Cream</option>
                                        <option value="inhaler">Inhaler</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price per Unit ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={inventoryData.price}
                                        onChange={(e) => setInventoryData({...inventoryData, price: parseFloat(e.target.value) || 0})}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input
                                        type="date"
                                        value={inventoryData.expiryDate}
                                        onChange={(e) => setInventoryData({...inventoryData, expiryDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Manufacturer</label>
                                <input
                                    type="text"
                                    value={inventoryData.manufacturer}
                                    onChange={(e) => setInventoryData({...inventoryData, manufacturer: e.target.value})}
                                    placeholder="Pharmaceutical company"
                                />
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={inventoryData.requiresPrescription}
                                        onChange={(e) => setInventoryData({...inventoryData, requiresPrescription: e.target.checked})}
                                    />
                                    Requires Prescription
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add to Inventory'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowInventoryModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {showRestockModal && selectedMedication && (
                <div className="modal-overlay" onClick={() => setShowRestockModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowRestockModal(false)}>×</button>
                        <h3>Restock Medication</h3>
                        <div className="inventory-summary">
                            <p><strong>Medication:</strong> {selectedMedication.medication_name}</p>
                            <p><strong>Current Stock:</strong> {selectedMedication.quantity} {selectedMedication.unit}</p>
                            <p><strong>Low Stock Threshold:</strong> {selectedMedication.min_stock_threshold || 10} units</p>
                        </div>
                        <form onSubmit={handleRestock}>
                            <div className="form-group">
                                <label>Quantity to Add *</label>
                                <input
                                    type="number"
                                    value={dispenseData.quantity}
                                    onChange={(e) => setDispenseData({...dispenseData, quantity: parseInt(e.target.value) || 0})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Updating...' : 'Restock'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowRestockModal(false)}>
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

export default PharmacistDashboard;