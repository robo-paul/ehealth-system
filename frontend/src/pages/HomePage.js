// src/pages/HomePage.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSensor } from '../hooks/useSensor'; // Changed from useBluetoothSensor
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { status, loading } = useSensor();
  
    const quickActions = [
        { icon: '👤', title: 'Member Login', link: '/login', color: '#3498db' },
        { icon: '📝', title: 'Register', link: '/register', color: '#27ae60' },
        { icon: '📞', title: '24/7 Support', link: '/contact', color: '#9b59b6' },
        { icon: '🏥', title: 'Our Services', link: '/solutions', color: '#1abc9c' },
        { icon: '❓', title: 'FAQ', link: '/faq', color: '#e67e22' },
    ];

    const services = [
        { name: 'iGo Wellness', icon: '🏃', link: '/igo' },
        { name: 'MedLabs', icon: '🔬', link: '/labs' },
        { name: 'Dental Care', icon: '🦷', link: '/dental' },
        { name: 'Optometry', icon: '👓', link: '/optical' },
        { name: 'Dialysis', icon: '💉', link: '/dialysis' },
        { name: 'Pharmacies', icon: '💊', link: '/pharmacy' },
        { name: 'Rescue Services', icon: '🚑', link: '/rescue' },
    ];

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title animate-fade-in">
                        Your Health, Our Priority
                    </h1>
                    <p className="hero-subtitle animate-fade-in-delay">
                        Comprehensive healthcare solutions with fingerprint security. 
                        Access quality medical care when and where you need it.
                    </p>
                    <div className="hero-buttons animate-fade-in-delay-2">
                        {!user ? (
                            <>
                                <button 
                                    className="btn-primary btn-large"
                                    onClick={() => navigate('/register')}
                                >
                                    Get Started
                                </button>
                                <button 
                                    className="btn-outline btn-large"
                                    onClick={() => navigate('/login')}
                                >
                                    Member Login
                                </button>
                            </>
                        ) : (
                            <button 
                                className="btn-primary btn-large"
                                onClick={() => navigate('/dashboard')}
                            >
                                Go to Dashboard
                            </button>
                        )}
                    </div>
                    
                    {/* Sensor Status */}
                    <div className="sensor-status">
                        <div className={`sensor-indicator ${status.connected ? 'connected' : 'disconnected'}`}>
                            <span className="sensor-dot"></span>
                            <span className="sensor-text">
                                {loading ? 'Checking sensor...' : 
                                 status.connected ? 'Fingerprint Sensor Ready' : 
                                 'Fingerprint Sensor Optional'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="quick-actions">
                <div className="container">
                    <h2 className="section-title">Quick Access</h2>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => (
                            <div 
                                key={index} 
                                className="action-card"
                                onClick={() => navigate(action.link)}
                                style={{ borderTopColor: action.color }}
                            >
                                <div className="action-icon" style={{ backgroundColor: action.color }}>
                                    {action.icon}
                                </div>
                                <h3>{action.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services-section" className="services-section">
                <div className="container">
                    <h2 className="section-title">Our Services</h2>
                    <p className="section-subtitle">
                        Comprehensive healthcare services under one roof
                    </p>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div 
                                key={index} 
                                className="service-card"
                                onClick={() => navigate(service.link)}
                            >
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Why Choose Us</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🔐</div>
                            <h3>Fingerprint Security</h3>
                            <p>Access your health records securely with biometric authentication</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🌍</div>
                            <h3>Regional Coverage</h3>
                            <p>Coverage across SADC region, sub-Saharan Africa, and India</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>24/7 Emergency Support</h3>
                            <p>Round-the-clock assistance for medical emergencies</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Mobile App Access</h3>
                            <p>Manage your health records anytime, anywhere</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to take control of your health?</h2>
                        <p>Join thousands of members who trust us with their healthcare needs</p>
                        <div className="cta-buttons">
                            <button 
                                className="btn-primary btn-large"
                                onClick={() => navigate('/register')}
                            >
                                Get Started Today
                            </button>
                            <button 
                                className="btn-outline-light btn-large"
                                onClick={() => navigate('/contact')}
                            >
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3>🏥 E-Health System</h3>
                            <p>Secure, accessible healthcare for everyone.</p>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/solutions">Solutions</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/faq">FAQ</Link></li>
                            </ul>
                        </div>
                        <div className="footer-contact">
                            <h4>Contact Us</h4>
                            <p>📞 +263 77 755 1956</p>
                            <p>✉️ info@ehealth.com</p>
                            <p>📍 HIT</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 E-Health System. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;