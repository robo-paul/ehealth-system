// src/pages/ContactPage.js
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import './ContactPage.css';

const ContactPage = () => {
    const { showSuccess, showError } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.message) {
            showError('Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        
        // Simulate API call - replace with actual backend endpoint
        try {
            // In production, you would send to your backend
            // await api.post('/contact', formData);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showSuccess('Message sent successfully! We will get back to you soon.');
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            showError('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: '📍',
            title: 'Visit Us',
            details: [
                'Head Office: Cimas House',
                'Borrowdale Office Park',
                'Borrowdale Road',
                'Harare, Zimbabwe'
            ]
        },
        {
            icon: '📞',
            title: 'Call Us',
            details: [
                '+263 867 7400 500',
                '08080001-3 (Toll Free)',
                'Emergency: +263 782 000 055'
            ]
        },
        {
            icon: '✉️',
            title: 'Email Us',
            details: [
                'General: info@ehealth.com',
                'Support: support@ehealth.com',
                'Claims: claims@ehealth.com'
            ]
        },
        {
            icon: '🕒',
            title: 'Office Hours',
            details: [
                'Monday - Friday: 8:00 AM - 5:00 PM',
                'Saturday: 9:00 AM - 1:00 PM',
                'Sunday: Closed',
                'Emergency: 24/7 Support'
            ]
        }
    ];

    const departments = [
        {
            name: 'Customer Support',
            email: 'support@ehealth.com',
            phone: '+263 867 7400 501',
            hours: '24/7 Support Available'
        },
        {
            name: 'Technical Support',
            email: 'tech@ehealth.com',
            phone: '+263 867 7400 502',
            hours: 'Mon-Fri, 8AM - 5PM'
        },
        {
            name: 'Billing & Accounts',
            email: 'billing@ehealth.com',
            phone: '+263 867 7400 503',
            hours: 'Mon-Fri, 8AM - 4PM'
        },
        {
            name: 'Medical Records',
            email: 'records@ehealth.com',
            phone: '+263 867 7400 504',
            hours: 'Mon-Fri, 8AM - 5PM'
        },
        {
            name: 'Claims Department',
            email: 'claims@ehealth.com',
            phone: '+263 867 7400 505',
            hours: 'Mon-Fri, 8AM - 4PM'
        },
        {
            name: 'Partnerships',
            email: 'partners@ehealth.com',
            phone: '+263 867 7400 506',
            hours: 'Mon-Fri, 9AM - 5PM'
        }
    ];

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Contact Us</h1>
                    <p>We're here to help. Reach out to us anytime.</p>
                </div>
            </section>

            {/* Contact Info Grid */}
            <section className="contact-info-section">
                <div className="container">
                    <div className="contact-info-grid">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="info-card">
                                <div className="info-icon">{info.icon}</div>
                                <h3>{info.title}</h3>
                                {info.details.map((detail, i) => (
                                    <p key={i}>{detail}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="contact-form-section">
                <div className="container">
                    <div className="form-container">
                        <div className="form-header">
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email address"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="What is this regarding?"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="message">Message *</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="6"
                                    placeholder="How can we help you?"
                                    required
                                    disabled={loading}
                                ></textarea>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="map-section">
                <div className="container">
                    <h2>Find Us</h2>
                    <div className="map-container">
                        <iframe
                            title="Office Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121890.1326462959!2d31.000000!3d-17.800000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1931a5e5e5e5e5e5%3A0x0!2zMTfCsDQ4JzAwLjAiUyAzMcKwMDAnMDAuMCJF!5e0!3m2!1sen!2szw!4v1234567890!5m2!1sen!2szw"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Departments Section */}
            <section className="departments-section">
                <div className="container">
                    <h2>Contact by Department</h2>
                    <div className="departments-grid">
                        {departments.map((dept, index) => (
                            <div key={index} className="department-card">
                                <h3>{dept.name}</h3>
                                <p className="department-email">
                                    <strong>Email:</strong> {dept.email}
                                </p>
                                <p className="department-phone">
                                    <strong>Phone:</strong> {dept.phone}
                                </p>
                                <p className="department-hours">
                                    <strong>Hours:</strong> {dept.hours}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Emergency Notice */}
            <section className="emergency-section">
                <div className="container">
                    <div className="emergency-banner">
                        <div className="emergency-icon">🚨</div>
                        <div className="emergency-content">
                            <h3>Medical Emergency?</h3>
                            <p>For immediate medical assistance, please call our emergency hotline.</p>
                        </div>
                        <div className="emergency-number">+263 782 000 055</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;