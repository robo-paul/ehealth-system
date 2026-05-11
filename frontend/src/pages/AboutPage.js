// src/pages/AboutPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
    const teamMembers = [
        {
            name: 'Dr. Sarah Johnson',
            role: 'Chief Medical Officer',
            image: '👩‍⚕️',
            bio: '20+ years of experience in healthcare management and digital health transformation.'
        },
        {
            name: 'Michael Chen',
            role: 'CTO & Lead Developer',
            image: '💻',
            bio: 'Expert in healthcare IT systems and secure biometric authentication.'
        },
        {
            name: 'Dr. James Wilson',
            role: 'Medical Director',
            image: '👨‍⚕️',
            bio: 'Specialist in patient care and healthcare quality assurance.'
        },
        {
            name: 'Emily Rodriguez',
            role: 'Head of Patient Services',
            image: '👩‍💼',
            bio: 'Dedicated to improving patient experience and accessibility.'
        }
    ];

    const values = [
        {
            icon: '🔒',
            title: 'Security First',
            description: 'Your health data is protected with military-grade encryption and biometric authentication.'
        },
        {
            icon: '❤️',
            title: 'Patient-Centered',
            description: 'Every feature is designed with patient needs and convenience in mind.'
        },
        {
            icon: '🌍',
            title: 'Accessible Healthcare',
            description: 'Making quality healthcare management accessible across SADC region and beyond.'
        },
        {
            icon: '⚡',
            title: 'Innovation',
            description: 'Continuously evolving with the latest in healthcare technology.'
        },
        {
            icon: '🤝',
            title: 'Trust & Transparency',
            description: 'Building trust through clear communication and transparent practices.'
        },
        {
            icon: '📈',
            title: 'Excellence',
            description: 'Committed to delivering the highest standard of healthcare management.'
        }
    ];

    const milestones = [
        { year: '2020', title: 'Founded', description: 'E-Health System was established with a vision to revolutionize healthcare management.' },
        { year: '2021', title: 'First Partnership', description: 'Partnered with leading hospitals across Zimbabwe to integrate our platform.' },
        { year: '2022', title: 'Fingerprint Auth Launch', description: 'Introduced biometric authentication for secure patient access.' },
        { year: '2023', title: 'Regional Expansion', description: 'Expanded services to SADC region and sub-Saharan Africa.' },
        { year: '2024', title: 'AI Integration', description: 'Launched AI-powered health insights and predictive analytics.' },
        { year: '2025', title: '10,000+ Users', description: 'Reached milestone of 10,000 active patients and 500 healthcare providers.' }
    ];

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>About E-Health System</h1>
                    <p>Transforming healthcare through innovation, security, and accessibility</p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="mission-section">
                <div className="container">
                    <div className="mission-grid">
                        <div className="mission-card">
                            <div className="mission-icon">🎯</div>
                            <h2>Our Mission</h2>
                            <p>To provide secure, accessible, and innovative healthcare management solutions that empower patients and healthcare providers alike.</p>
                        </div>
                        <div className="mission-card">
                            <div className="mission-icon">👁️</div>
                            <h2>Our Vision</h2>
                            <p>A world where every individual has secure, instant access to their health records, enabling better healthcare outcomes through technology.</p>
                        </div>
                        <div className="mission-card">
                            <div className="mission-icon">💡</div>
                            <h2>Our Philosophy</h2>
                            <p>We believe healthcare is a right, not a privilege. Technology should bridge gaps, not create barriers.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container">
                    <div className="story-content">
                        <h2>Our Story</h2>
                        <p>E-Health System was born from a simple observation: patients deserve better access to their own health information. In 2020, a team of healthcare professionals and technology experts came together with a shared vision to create a platform that puts patients at the center of their healthcare journey.</p>
                        <p>What started as a small initiative has grown into a comprehensive health management system serving thousands of patients across Zimbabwe and the SADC region. Our commitment to security, innovation, and patient-centric design has made us a trusted partner in healthcare management.</p>
                        <p>Today, we continue to evolve, integrating cutting-edge technologies like biometric authentication to ensure that your health data remains secure while being instantly accessible when you need it most.</p>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <h2>Our Core Values</h2>
                    <div className="values-grid">
                        {values.map((value, index) => (
                            <div key={index} className="value-card">
                                <div className="value-icon">{value.icon}</div>
                                <h3>{value.title}</h3>
                                <p>{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="timeline-section">
                <div className="container">
                    <h2>Our Journey</h2>
                    <div className="timeline">
                        {milestones.map((milestone, index) => (
                            <div key={index} className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="timeline-badge">{milestone.year}</div>
                                <div className="timeline-content">
                                    <h3>{milestone.title}</h3>
                                    <p>{milestone.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="container">
                    <h2>Meet Our Leadership Team</h2>
                    <div className="team-grid">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="team-card">
                                <div className="team-avatar">{member.image}</div>
                                <h3>{member.name}</h3>
                                <p className="team-role">{member.role}</p>
                                <p className="team-bio">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid-about">
                        <div className="stat-item">
                            <div className="stat-number">10,000+</div>
                            <div className="stat-label-about">Active Patients</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">500+</div>
                            <div className="stat-label-about">Healthcare Providers</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">50+</div>
                            <div className="stat-label-about">Partner Facilities</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label-about">Support Available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-about-section">
                <div className="container">
                    <div className="cta-about-content">
                        <h2>Join Our Community</h2>
                        <p>Be part of the healthcare revolution. Register today and take control of your health journey.</p>
                        <div className="cta-about-buttons">
                            <Link to="/register" className="btn-primary-large">Get Started</Link>
                            <Link to="/contact" className="btn-outline-large">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;