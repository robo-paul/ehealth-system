// src/components/finance/FinanceDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
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
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayments: 0,
        paidInvoices: 0,
        outstandingBalance: 0
    });
    const [revenueData, setRevenueData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        yearly: []
    });
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [patients, setPatients] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch financial data
            const statsRes = await api.get('/finance/stats');
            setStats(statsRes.data);
            
            // Fetch revenue data
            const revenueRes = await api.get(`/finance/revenue?period=${selectedPeriod}`);
            setRevenueData(revenueRes.data);
            
            // Fetch invoices
            const invoicesRes = await api.get('/finance/invoices');
            setInvoices(invoicesRes.data || []);
            
            // Fetch payments
            const paymentsRes = await api.get('/finance/payments');
            setPayments(paymentsRes.data || []);
            
            // Fetch patients for invoice creation
            const patientsRes = await api.get('/patients');
            setPatients(patientsRes.data || []);
            
        } catch (error) {
            console.error('Error fetching finance data:', error);
            showError('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, showError]);

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
            await api.post('/finance/invoices', invoiceData);
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
            await api.post(`/finance/invoices/${selectedInvoice.id}/pay`, paymentData);
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

    const getStatusBadge = (status) => {
        switch(status) {
            case 'paid':
                return <span className="status-badge paid">✅ Paid</span>;
            case 'pending':
                return <span className="status-badge pending">⏳ Pending</span>;
            case 'overdue':
                return <span className="status-badge overdue">⚠️ Overdue</span>;
            case 'cancelled':
                return <span className="status-badge cancelled">✗ Cancelled</span>;
            default:
                return <span className="status-badge pending">{status}</span>;
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

    const filteredPayments = payments.filter(payment =>
        payment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading finance dashboard...</p>
            </div>
        );
    }

    return (
        <div className="finance-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Finance Dashboard</h1>
                    <p>Welcome, {user?.username || 'Finance Officer'}</p>
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

            {/* Revenue Chart Section */}
            <div className="revenue-section">
                <div className="section-header">
                    <h2>Revenue Overview</h2>
                    <div className="period-selector">
                        <button 
                            className={`period-btn ${selectedPeriod === 'day' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('day')}
                        >
                            Daily
                        </button>
                        <button 
                            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('week')}
                        >
                            Weekly
                        </button>
                        <button 
                            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('month')}
                        >
                            Monthly
                        </button>
                        <button 
                            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod('year')}
                        >
                            Yearly
                        </button>
                    </div>
                </div>
                <div className="revenue-chart">
                    <div className="chart-bars">
                        {(revenueData[selectedPeriod === 'day' ? 'daily' : 
                                    selectedPeriod === 'week' ? 'weekly' : 
                                    selectedPeriod === 'month' ? 'monthly' : 'yearly'] || []).map((item, index) => {
                            const maxRevenue = Math.max(...(revenueData[selectedPeriod === 'day' ? 'daily' : 
                                selectedPeriod === 'week' ? 'weekly' : 
                                selectedPeriod === 'month' ? 'monthly' : 'yearly'] || []).map(i => i.amount), 1);
                            const height = (item.amount / maxRevenue) * 200;
                            return (
                                <div key={index} className="chart-bar-container">
                                    <div className="chart-bar" style={{ height: `${height}px` }}>
                                        <span className="bar-value">{formatCurrency(item.amount)}</span>
                                    </div>
                                    <span className="bar-label">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search invoices or payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            {/* Invoices Section */}
            <div className="invoices-section">
                <h2>Invoices</h2>
                <div className="invoices-table-container">
                    {filteredInvoices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            <h3>No Invoices Found</h3>
                            <p>{searchTerm ? 'No invoices match your search.' : 'No invoices have been created yet.'}</p>
                        </div>
                    ) : (
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
                                        <td className="patient-name">
                                            <strong>{invoice.patient_name}</strong>
                                            <span className="patient-id-small">ID: {invoice.patient_id}</span>
                                        </td>
                                        <td className="amount">{formatCurrency(invoice.amount)}</td>
                                        <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                                        <td className={new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'overdue-date' : ''}>
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>{getStatusBadge(invoice.status)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {invoice.status === 'pending' && (
                                                    <button 
                                                        type="button"
                                                        className="btn-pay"
                                                        onClick={() => {
                                                            setSelectedInvoice(invoice);
                                                            setShowPaymentModal(true);
                                                        }}
                                                    >
                                                        💰 Record Payment
                                                    </button>
                                                )}
                                                <button 
                                                    type="button"
                                                    className="btn-view"
                                                    onClick={() => {
                                                        // View invoice details
                                                        alert(`Invoice Details:\nPatient: ${invoice.patient_name}\nAmount: ${formatCurrency(invoice.amount)}\nStatus: ${invoice.status}`);
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
                    )}
                </div>
            </div>

            {/* Recent Payments Section */}
            <div className="payments-section">
                <h2>Recent Payments</h2>
                <div className="payments-table-container">
                    <table className="payments-table">
                        <thead>
                            <tr>
                                <th>Payment #</th>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Date</th>
                                <th>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.slice(0, 20).map(payment => (
                                <tr key={payment.id}>
                                    <td>{payment.payment_number}</td>
                                    <td>{payment.invoice_number}</td>
                                    <td>
                                        <strong>{payment.patient_name}</strong>
                                    </td>
                                    <td className="amount">{formatCurrency(payment.amount)}</td>
                                    <td>
                                        <span className="payment-method">
                                            {payment.method === 'cash' ? '💵 Cash' : 
                                             payment.method === 'card' ? '💳 Card' : 
                                             payment.method === 'bank_transfer' ? '🏦 Bank Transfer' : 
                                             payment.method === 'insurance' ? '🏥 Insurance' : payment.method}
                                        </span>
                                    </td>
                                    <td>{new Date(payment.paid_at).toLocaleDateString()}</td>
                                    <td className="reference">{payment.reference || '-'}</td>
                                </tr>
                            ))}
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

            {/* Record Payment Modal */}
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

export default FinanceDashboard;