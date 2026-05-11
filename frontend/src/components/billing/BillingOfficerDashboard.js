// src/components/billing/BillingOfficerDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './BillingOfficerDashboard.css';

const BillingOfficerDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [setPayments] = useState([]); // FIXED: Changed from [setPayments] to [payments, setPayments]
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceData, setInvoiceData] = useState({
        patientId: '',
        amount: '',
        description: '',
        dueDate: ''
    });
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'cash',
        reference: ''
    });
    const [submitting, setSubmitting] = useState(false); // FIXED: Changed from [setSubmitting] to [submitting, setSubmitting]
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayments: 0,
        paidInvoices: 0,
        outstandingBalance: 0,
        totalPatients: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            const [patientsRes, invoicesRes, paymentsRes, statsRes] = await Promise.all([
                api.get('/patients'),
                api.get('/billing/invoices'),
                api.get('/billing/payments'),
                api.get('/billing/stats')
            ]);
            
            setPatients(patientsRes.data || []);
            setInvoices(invoicesRes.data || []);
            setPayments(paymentsRes.data || []);
            setStats(statsRes.data);
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load billing data');
        } finally {
            setLoading(false);
        }
    }, [showError, setPayments]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        if (!invoiceData.patientId || !invoiceData.amount || invoiceData.amount <= 0) {
            showError('Please select a patient and enter a valid amount');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post('/billing/invoices', invoiceData);
            showSuccess('Invoice created successfully');
            setShowInvoiceModal(false);
            setInvoiceData({ patientId: '', amount: '', description: '', dueDate: '' });
            fetchData();
        } catch (error) {
            showError('Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice || !paymentData.amount || paymentData.amount <= 0) {
            showError('Please enter a valid payment amount');
            return;
        }
        
        setSubmitting(true);
        try {
            await api.post(`/billing/invoices/${selectedInvoice.id}/pay`, paymentData);
            showSuccess('Payment recorded successfully');
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentData({ amount: '', method: 'cash', reference: '' });
            fetchData();
        } catch (error) {
            showError('Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPatients = patients.filter(patient =>
        patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.full_name && patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading billing dashboard...</p>
            </div>
        );
    }

    return (
        <div className="billing-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Billing Officer Dashboard</h1>
                    <p>Welcome, {user?.username}</p>
                </div>
                <div className="header-actions">
                    <button type="button" className="btn-primary" onClick={() => setShowInvoiceModal(true)}>
                        📄 + Create Invoice
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card revenue">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                        <div className="stat-label">Total Revenue</div>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{formatCurrency(stats.pendingPayments)}</div>
                        <div className="stat-label">Pending Payments</div>
                    </div>
                </div>
                <div className="stat-card paid">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.paidInvoices}</div>
                        <div className="stat-label">Paid Invoices</div>
                    </div>
                </div>
                <div className="stat-card outstanding">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-value">{formatCurrency(stats.outstandingBalance)}</div>
                        <div className="stat-label">Outstanding Balance</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search invoices or patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Invoices Section */}
            <div className="invoices-section">
                <h2>All Invoices</h2>
                <div className="invoices-table-container">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td className="invoice-number">{invoice.invoice_number}</td>
                                    <td><strong>{invoice.patient_name}</strong></td>
                                    <td className="amount">{formatCurrency(invoice.amount)}</td>
                                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                                    <td className={new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'overdue' : ''}>
                                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td>
                                        {invoice.status === 'paid' ? 
                                            <span className="badge-paid">Paid</span> : 
                                            <span className="badge-pending">Pending</span>
                                        }
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {invoice.status === 'pending' && (
                                                <button 
                                                    className="btn-pay" 
                                                    onClick={() => { 
                                                        setSelectedInvoice(invoice); 
                                                        setShowPaymentModal(true); 
                                                    }}
                                                >
                                                    💰 Pay
                                                </button>
                                            )}
                                            <button 
                                                className="btn-view" 
                                                onClick={() => {
                                                    alert(`Invoice Details:\nNumber: ${invoice.invoice_number}\nPatient: ${invoice.patient_name}\nAmount: ${formatCurrency(invoice.amount)}\nStatus: ${invoice.status}`);
                                                }}
                                            >
                                                👁️ View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Patient List Section */}
            <div className="patients-section">
                <h2>Patient List</h2>
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Contact</th>
                                <th>Total Billed</th>
                                <th>Outstanding</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map(patient => {
                                const patientInvoices = invoices.filter(i => i.patient_id === patient.id);
                                const totalBilled = patientInvoices.reduce((sum, i) => sum + i.amount, 0);
                                const outstanding = patientInvoices.reduce((sum, i) => sum + (i.status === 'pending' ? i.amount - (i.paid_amount || 0) : 0), 0);
                                return (
                                    <tr key={patient.id}>
                                        <td>
                                            <strong>{patient.full_name || patient.username}</strong>
                                            <br/>
                                            <small>ID: {patient.health_record_id}</small>
                                        </td>
                                        <td>{patient.contact_number || '-'}</td>
                                        <td>{formatCurrency(totalBilled)}</td>
                                        <td className={outstanding > 0 ? 'outstanding' : ''}>{formatCurrency(outstanding)}</td>
                                        <td>
                                            <button 
                                                className="btn-invoice" 
                                                onClick={() => { 
                                                    setInvoiceData({...invoiceData, patientId: patient.id}); 
                                                    setShowInvoiceModal(true); 
                                                }}
                                            >
                                                📄 Create Invoice
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Invoice Modal */}
            {showInvoiceModal && (
                <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowInvoiceModal(false)}>×</button>
                        <h3>Create New Invoice</h3>
                        <form onSubmit={handleCreateInvoice}>
                            <div className="form-group">
                                <label>Select Patient *</label>
                                <select
                                    value={invoiceData.patientId}
                                    onChange={(e) => setInvoiceData({...invoiceData, patientId: e.target.value})}
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
                            <div className="form-group">
                                <label>Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={invoiceData.amount}
                                    onChange={(e) => setInvoiceData({...invoiceData, amount: parseFloat(e.target.value)})}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={invoiceData.description}
                                    onChange={(e) => setInvoiceData({...invoiceData, description: e.target.value})}
                                    rows="3"
                                    placeholder="Description of services or items..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={invoiceData.dueDate}
                                    onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Invoice'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
                        <h3>Record Payment</h3>
                        <div className="invoice-summary">
                            <p><strong>Invoice #:</strong> {selectedInvoice.invoice_number}</p>
                            <p><strong>Patient:</strong> {selectedInvoice.patient_name}</p>
                            <p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.amount)}</p>
                            <p><strong>Outstanding:</strong> {formatCurrency(selectedInvoice.amount - (selectedInvoice.paid_amount || 0))}</p>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-group">
                                <label>Payment Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                                    placeholder="0.00"
                                    max={selectedInvoice.amount - (selectedInvoice.paid_amount || 0)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select
                                    value={paymentData.method}
                                    onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reference / Transaction ID</label>
                                <input
                                    type="text"
                                    value={paymentData.reference}
                                    onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                                    placeholder="Transaction reference number"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-success" disabled={submitting}>
                                    {submitting ? 'Processing...' : 'Record Payment'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
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

export default BillingOfficerDashboard;