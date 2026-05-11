// src/components/admin/HospitalAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './HospitalAdminDashboard.css';

const HospitalAdminDashboard = () => {
    const { user } = useAuth();
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Statistics State
    const [stats, setStats] = useState({
        patients: {
            total: 0,
            newToday: 0,
            active: 0,
            admitted: 0
        },
        appointments: {
            total: 0,
            today: 0,
            completed: 0,
            cancelled: 0
        },
        prescriptions: {
            total: 0,
            dispensed: 0,
            pending: 0
        },
        admissions: {
            active: 0,
            dischargedToday: 0,
            averageStay: 0,
            bedOccupancy: 0
        },
        lab: {
            total: 0,
            pending: 0,
            completed: 0,
            urgent: 0
        },
        radiology: {
            total: 0,
            pending: 0,
            completed: 0
        },
        pharmacy: {
            totalItems: 0,
            lowStock: 0,
            expiringSoon: 0
        },
        finance: {
            totalRevenue: 0,
            pendingPayments: 0,
            paidInvoices: 0
        },
        staff: {
            total: 0,
            doctors: 0,
            nurses: 0,
            other: 0
        }
    });
    
    const [departmentData, setDepartmentData] = useState({
        revenueByDepartment: [],
        appointmentsByDepartment: [],
        patientFlow: []
    });
    
    const [recentActivities, setRecentActivities] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch all statistics
            const statsRes = await api.get('/admin/dashboard/stats');
            setStats(statsRes.data);
            
            // Fetch department data
            const deptRes = await api.get(`/admin/dashboard/departments?period=${selectedPeriod}`);
            setDepartmentData(deptRes.data);
            
            // Fetch recent activities
            const activitiesRes = await api.get('/admin/dashboard/activities');
            setRecentActivities(activitiesRes.data || []);
            
            // Fetch alerts
            const alertsRes = await api.get('/admin/dashboard/alerts');
            setAlerts(alertsRes.data || []);
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, showError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getAlertIcon = (type) => {
        switch(type) {
            case 'critical': return '🔴';
            case 'warning': return '🟡';
            case 'info': return '🔵';
            default: return '⚪';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading hospital dashboard...</p>
            </div>
        );
    }

    return (
        <div className="hospital-admin-dashboard">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Hospital Executive Dashboard</h1>
                    <p>Welcome, {user?.username || 'Administrator'}</p>
                    <span className="last-updated">Last updated: {new Date().toLocaleString()}</span>
                </div>
                <div className="period-selector">
                    <button 
                        className={`period-btn ${selectedPeriod === 'day' ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod('day')}
                    >
                        Today
                    </button>
                    <button 
                        className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod('year')}
                    >
                        This Year
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clinical')}
                >
                    🏥 Clinical
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('financial')}
                >
                    💰 Financial
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('operations')}
                >
                    ⚙️ Operations
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Key Metrics */}
                    <div className="key-metrics-grid">
                        <div className="metric-card patients">
                            <div className="metric-icon">👥</div>
                            <div className="metric-info">
                                <div className="metric-value">{stats.patients.total}</div>
                                <div className="metric-label">Total Patients</div>
                                <div className="metric-trend">+{stats.patients.newToday} today</div>
                            </div>
                        </div>
                        <div className="metric-card appointments">
                            <div className="metric-icon">📅</div>
                            <div className="metric-info">
                                <div className="metric-value">{stats.appointments.today}</div>
                                <div className="metric-label">Today's Appointments</div>
                                <div className="metric-trend">{stats.appointments.completed} completed</div>
                            </div>
                        </div>
                        <div className="metric-card admissions">
                            <div className="metric-icon">🏥</div>
                            <div className="metric-info">
                                <div className="metric-value">{stats.admissions.active}</div>
                                <div className="metric-label">Active Admissions</div>
                                <div className="metric-trend">{stats.admissions.bedOccupancy}% occupancy</div>
                            </div>
                        </div>
                        <div className="metric-card revenue">
                            <div className="metric-icon">💰</div>
                            <div className="metric-info">
                                <div className="metric-value">{formatCurrency(stats.finance.totalRevenue)}</div>
                                <div className="metric-label">Total Revenue</div>
                                <div className="metric-trend">{formatCurrency(stats.finance.pendingPayments)} pending</div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {alerts.length > 0 && (
                        <div className="alerts-section">
                            <h3>⚠️ Critical Alerts</h3>
                            <div className="alerts-list">
                                {alerts.map((alert, index) => (
                                    <div key={index} className={`alert-item ${alert.type}`}>
                                        <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                                        <div className="alert-content">
                                            <strong>{alert.title}</strong>
                                            <p>{alert.message}</p>
                                        </div>
                                        <span className="alert-time">{alert.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Department Performance */}
                    <div className="departments-section">
                        <h3>Department Performance</h3>
                        <div className="departments-grid">
                            <div className="dept-card">
                                <h4>👨‍⚕️ Medical</h4>
                                <div className="dept-stats">
                                    <div className="dept-stat">
                                        <span className="stat-value">{departmentData.appointmentsByDepartment?.find(d => d.name === 'Medical')?.count || 0}</span>
                                        <span className="stat-label">Appointments</span>
                                    </div>
                                    <div className="dept-stat">
                                        <span className="stat-value">{formatCurrency(departmentData.revenueByDepartment?.find(d => d.name === 'Medical')?.revenue || 0)}</span>
                                        <span className="stat-label">Revenue</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dept-card">
                                <h4>🔬 Laboratory</h4>
                                <div className="dept-stats">
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.lab.pending}</span>
                                        <span className="stat-label">Pending Tests</span>
                                    </div>
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.lab.completed}</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dept-card">
                                <h4>📷 Radiology</h4>
                                <div className="dept-stats">
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.radiology.pending}</span>
                                        <span className="stat-label">Pending Studies</span>
                                    </div>
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.radiology.completed}</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dept-card">
                                <h4>💊 Pharmacy</h4>
                                <div className="dept-stats">
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.pharmacy.lowStock}</span>
                                        <span className="stat-label">Low Stock Items</span>
                                    </div>
                                    <div className="dept-stat">
                                        <span className="stat-value">{stats.prescriptions.dispensed}</span>
                                        <span className="stat-label">Prescriptions Filled</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="activities-section">
                        <h3>Recent Activities</h3>
                        <div className="activities-list">
                            {recentActivities.slice(0, 10).map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">{activity.icon}</div>
                                    <div className="activity-details">
                                        <div className="activity-title">{activity.title}</div>
                                        <div className="activity-description">{activity.description}</div>
                                    </div>
                                    <div className="activity-time">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Clinical Tab */}
            {activeTab === 'clinical' && (
                <div className="clinical-tab">
                    <div className="stats-grid-2col">
                        <div className="stat-card">
                            <h3>Patient Statistics</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Registered:</span>
                                    <strong>{stats.patients.total}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Active Patients:</span>
                                    <strong>{stats.patients.active}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Currently Admitted:</span>
                                    <strong>{stats.admissions.active}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Average Stay:</span>
                                    <strong>{stats.admissions.averageStay} days</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Appointment Statistics</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Appointments:</span>
                                    <strong>{stats.appointments.total}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Today:</span>
                                    <strong>{stats.appointments.today}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Completed:</span>
                                    <strong>{stats.appointments.completed}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Cancelled:</span>
                                    <strong>{stats.appointments.cancelled}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Laboratory Statistics</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Tests:</span>
                                    <strong>{stats.lab.total}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Pending:</span>
                                    <strong>{stats.lab.pending}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Completed:</span>
                                    <strong>{stats.lab.completed}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Urgent:</span>
                                    <strong className="urgent">{stats.lab.urgent}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Radiology Statistics</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Studies:</span>
                                    <strong>{stats.radiology.total}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Pending Review:</span>
                                    <strong>{stats.radiology.pending}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Completed:</span>
                                    <strong>{stats.radiology.completed}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
                <div className="financial-tab">
                    <div className="stats-grid-2col">
                        <div className="stat-card">
                            <h3>Revenue Overview</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Revenue:</span>
                                    <strong className="revenue">{formatCurrency(stats.finance.totalRevenue)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Paid Invoices:</span>
                                    <strong>{stats.finance.paidInvoices}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Pending Payments:</span>
                                    <strong className="pending">{formatCurrency(stats.finance.pendingPayments)}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Revenue by Department</h3>
                            <div className="dept-revenue-list">
                                {departmentData.revenueByDepartment?.map((dept, index) => (
                                    <div key={index} className="revenue-row">
                                        <span>{dept.name}</span>
                                        <strong>{formatCurrency(dept.revenue)}</strong>
                                        <div className="revenue-bar">
                                            <div className="revenue-fill" style={{ width: `${(dept.revenue / stats.finance.totalRevenue) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operations Tab */}
            {activeTab === 'operations' && (
                <div className="operations-tab">
                    <div className="stats-grid-2col">
                        <div className="stat-card">
                            <h3>Staff Overview</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Total Staff:</span>
                                    <strong>{stats.staff.total}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Doctors:</span>
                                    <strong>{stats.staff.doctors}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Nurses:</span>
                                    <strong>{stats.staff.nurses}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Other Staff:</span>
                                    <strong>{stats.staff.other}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Pharmacy Status</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Inventory Items:</span>
                                    <strong>{stats.pharmacy.totalItems}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Low Stock:</span>
                                    <strong className="warning">{stats.pharmacy.lowStock}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Expiring Soon:</span>
                                    <strong className="warning">{stats.pharmacy.expiringSoon}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Admissions & Discharges</h3>
                            <div className="stat-list">
                                <div className="stat-row">
                                    <span>Currently Admitted:</span>
                                    <strong>{stats.admissions.active}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Discharged Today:</span>
                                    <strong>{stats.admissions.dischargedToday}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>Bed Occupancy Rate:</span>
                                    <strong>{stats.admissions.bedOccupancy}%</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalAdminDashboard;