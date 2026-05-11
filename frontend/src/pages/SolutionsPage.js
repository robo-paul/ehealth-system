// src/pages/SolutionsPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './SolutionsPage.css';

const SolutionsPage = () => {
    const healthPlans = [
        {
            id: 'guardian',
            name: 'Guardian Care',
            icon: '🛡️',
            color: '#4f2f7c',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            tagline: 'Major Medical & Emergency Cover',
            description: 'Comprehensive coverage for major medical events, emergencies, advanced imaging, private hospitalisation, surgery, cancer treatment, and international evacuations.',
            features: [
                'Emergency Services 24/7',
                'Advanced Imaging (MRI, CT Scan)',
                'Private Hospitalisation',
                'Major Surgery Coverage',
                'Cancer Treatment & Chemotherapy',
                'International Medical Evacuations',
                'Specialist Consultations',
                'ICU & High Care Cover'
            ],
            price: 'From $89/month',
            link: '/register'
        },
        {
            id: 'access',
            name: 'Access Care',
            icon: '🚪',
            color: '#2c3e50',
            gradient: 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)',
            tagline: 'Essential Healthcare Cover',
            description: 'Emergency services, hospital admissions, consultations with doctors and specialists, diagnostic imaging, and outpatient treatment for acute illnesses.',
            features: [
                '24/7 Emergency Services',
                'Hospital Admissions',
                'GP & Specialist Consultations',
                'Diagnostic Imaging (X-ray, Ultrasound)',
                'Outpatient Treatment',
                'Pathology & Laboratory Services',
                'Prescription Medication Cover',
                'Ambulance Services'
            ],
            price: 'From $47/month',
            link: '/register'
        },
        {
            id: 'vantage',
            name: 'Vantage Care',
            icon: '⭐',
            color: '#27ae60',
            gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            tagline: 'Comprehensive Wellness Cover',
            description: 'Management of chronic conditions, maternity care, dental services, optical equipment, wellness programs, and preventative care services.',
            features: [
                'Chronic Condition Management',
                'Maternity & Prenatal Care',
                'Comprehensive Dental Services',
                'Optical Equipment & Eyeglasses',
                'Wellness & Fitness Programs',
                'Preventative Care & Screenings',
                'Mental Health Support',
                'Alternative & Complementary Medicine'
            ],
            price: 'From $140/month',
            link: '/register'
        }
    ];

    const services = [
        {
            name: 'iGo Wellness',
            icon: '🏃',
            description: 'Personalized wellness programs and health tracking to help you achieve your fitness goals.',
            features: [
                'Personalized Fitness Plans',
                'Activity & Health Tracking',
                'Nutrition Guidance',
                'Wellness Challenges',
                'Health Score Assessment',
                'Rewards & Incentives'
            ],
            link: '/igo',
            color: '#3498db'
        },
        {
            name: 'MedLabs',
            icon: '🔬',
            description: 'Comprehensive laboratory and diagnostic services with fast, accurate results.',
            features: [
                'Blood Tests & Analysis',
                'Pathology Services',
                'Genetic Testing',
                'Allergy Testing',
                'Hormone Testing',
                'Rapid Result Delivery'
            ],
            link: '/labs',
            color: '#9b59b6'
        },
        {
            name: 'Dental Care',
            icon: '🦷',
            description: 'Full dental services including orthodontics, cosmetic dentistry, and preventive care.',
            features: [
                'Regular Check-ups & Cleaning',
                'Fillings & Restorations',
                'Root Canal Treatment',
                'Orthodontics (Braces)',
                'Teeth Whitening',
                'Dental Implants'
            ],
            link: '/dental',
            color: '#e74c3c'
        },
        {
            name: 'Optometry',
            icon: '👓',
            description: 'Eye examinations and optical equipment for clear vision and eye health.',
            features: [
                'Comprehensive Eye Exams',
                'Glaucoma & Cataract Screening',
                'Prescription Eyeglasses',
                'Contact Lenses',
                'Pediatric Eye Care',
                'Low Vision Services'
            ],
            link: '/optical',
            color: '#f39c12'
        },
        {
            name: 'Dialysis',
            icon: '💉',
            description: 'Specialized renal care and dialysis services for patients with kidney conditions.',
            features: [
                'Hemodialysis Treatment',
                'Peritoneal Dialysis',
                'Renal Nutrition Counseling',
                'Vascular Access Management',
                '24/7 Emergency Dialysis',
                'Home Dialysis Training'
            ],
            link: '/dialysis',
            color: '#1abc9c'
        },
        {
            name: 'Pharmacies',
            icon: '💊',
            description: 'Convenient prescription services with medication delivery and consultation.',
            features: [
                'Prescription Dispensing',
                'Medication Delivery',
                'Pharmacist Consultations',
                'Medication Management',
                'Chronic Medication Refills',
                'Health & Wellness Products'
            ],
            link: '/pharmacy',
            color: '#e67e22'
        },
        {
            name: 'Rescue Services',
            icon: '🚑',
            description: '24/7 emergency medical rescue and ambulance services for critical situations.',
            features: [
                '24/7 Emergency Response',
                'Advanced Life Support Ambulances',
                'Medical Evacuation',
                'On-Site Emergency Care',
                'Inter-facility Transfers',
                'Trained Paramedics'
            ],
            link: '/rescue',
            color: '#e74c3c'
        },
        {
            name: 'Cimas Care',
            icon: '❤️',
            description: 'Comprehensive primary healthcare services for individuals and families.',
            features: [
                'General Practitioner Consultations',
                'Preventive Care & Screenings',
                'Vaccinations & Immunizations',
                'Women\'s Health Services',
                'Men\'s Health Services',
                'Family Planning'
            ],
            link: '/cimas-care',
            color: '#e84393'
        },
        {
            name: 'Telemedicine',
            icon: '💻',
            description: 'Virtual consultations with doctors from the comfort of your home.',
            features: [
                'Video Consultations',
                'Prescription Refills',
                'Follow-up Appointments',
                'Medical Advice & Guidance',
                'Specialist Referrals',
                'Digital Prescriptions'
            ],
            link: '/telemedicine',
            color: '#3498db'
        },
        {
            name: 'Mental Health',
            icon: '🧠',
            description: 'Psychological and psychiatric support for mental wellbeing.',
            features: [
                'Individual Therapy',
                'Psychiatric Consultations',
                'Anxiety & Depression Support',
                'Stress Management',
                'Couples Counseling',
                'Trauma Therapy'
            ],
            link: '/mental-health',
            color: '#9b59b6'
        },
        {
            name: 'Physiotherapy',
            icon: '🦵',
            description: 'Rehabilitation and physical therapy for injury recovery and mobility.',
            features: [
                'Post-Surgery Rehabilitation',
                'Sports Injury Treatment',
                'Back & Neck Pain Relief',
                'Joint Mobility Therapy',
                'Occupational Therapy',
                'Pediatric Physiotherapy'
            ],
            link: '/physiotherapy',
            color: '#27ae60'
        },
        {
            name: 'Nutrition',
            icon: '🥗',
            description: 'Dietary planning and nutrition advice for optimal health.',
            features: [
                'Personalized Meal Plans',
                'Weight Management Programs',
                'Sports Nutrition',
                'Medical Nutrition Therapy',
                'Nutritional Counseling',
                'Dietary Supplement Guidance'
            ],
            link: '/nutrition',
            color: '#f1c40f'
        }
    ];

    const scrollToServices = () => {
        const servicesSection = document.getElementById('services-section');
        if (servicesSection) {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="solutions-page">
            {/* Hero Section */}
            <section className="solutions-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Healthcare Solutions</h1>
                    <p>Comprehensive health plans and services designed for every stage of life</p>
                    <button onClick={scrollToServices} className="btn-hero">Explore Solutions</button>
                </div>
            </section>

            {/* Health Plans Section */}
            <section id="plans-section" className="plans-section-solutions">
                <div className="container">
                    <h2>Health Plans</h2>
                    <p className="section-subtitle">Choose the plan that best fits your needs and budget</p>
                    <div className="plans-grid">
                        {healthPlans.map((plan) => (
                            <div key={plan.id} className="plan-card-solutions">
                                <div className="plan-header" style={{ background: plan.gradient }}>
                                    <div className="plan-icon-large">{plan.icon}</div>
                                    <h3>{plan.name}</h3>
                                    <p className="plan-tagline">{plan.tagline}</p>
                                    <div className="plan-price">{plan.price}</div>
                                </div>
                                <div className="plan-body">
                                    <p className="plan-description">{plan.description}</p>
                                    <ul className="plan-features-list">
                                        {plan.features.slice(0, 5).map((feature, idx) => (
                                            <li key={idx}>
                                                <span className="feature-check">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                        {plan.features.length > 5 && (
                                            <li className="more-features">+{plan.features.length - 5} more benefits</li>
                                        )}
                                    </ul>
                                    <Link to={plan.link} className="btn-plan-solutions">
                                        Enroll Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Services Section */}
            <section id="services-section" className="services-section-solutions">
                <div className="container">
                    <h2>Our Services</h2>
                    <p className="section-subtitle">Comprehensive healthcare services under one roof</p>
                    <div className="services-grid-solutions">
                        {services.map((service, index) => (
                            <div key={index} className="service-card-solutions">
                                <div className="service-icon-solutions">{service.icon}</div>
                                <h3>{service.name}</h3>
                                <p className="service-description">{service.description}</p>
                                <div className="service-features">
                                    {service.features.slice(0, 2).map((feature, idx) => (
                                        <span key={idx} className="feature-tag">{feature}</span>
                                    ))}
                                    {service.features.length > 2 && (
                                        <span className="feature-tag-more">+{service.features.length - 2}</span>
                                    )}
                                </div>
                                <Link to={service.link} className="service-link">
                                    Learn More <span className="arrow">→</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="why-choose-section">
                <div className="container">
                    <h2>Why Choose Our Solutions</h2>
                    <div className="features-grid-solutions">
                        <div className="feature-item">
                            <div className="feature-icon">🔐</div>
                            <h3>Secure & Private</h3>
                            <p>Military-grade encryption with biometric fingerprint authentication for your peace of mind.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🌍</div>
                            <h3>Regional Coverage</h3>
                            <p>Comprehensive coverage across SADC region, sub-Saharan Africa, and India.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <h3>24/7 Emergency Support</h3>
                            <p>Round-the-clock emergency medical support with rapid response times.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📱</div>
                            <h3>Digital Access</h3>
                            <p>Manage your health records, appointments, and prescriptions anytime, anywhere.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">👨‍⚕️</div>
                            <h3>Expert Network</h3>
                            <p>Access to a vast network of qualified healthcare professionals and specialists.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💊</div>
                            <h3>Prescription Delivery</h3>
                            <p>Convenient medication delivery to your doorstep for chronic conditions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section-solutions">
                <div className="container">
                    <div className="stats-grid-solutions">
                        <div className="stat-item">
                            <div className="stat-number">10,000+</div>
                            <div className="stat-label">Active Patients</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Healthcare Providers</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">50+</div>
                            <div className="stat-label">Partner Facilities</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">98%</div>
                            <div className="stat-label">Patient Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-solutions-section">
                <div className="container">
                    <div className="cta-content-solutions">
                        <h2>Ready to get started?</h2>
                        <p>Join thousands of satisfied members who trust our healthcare solutions</p>
                        <Link to="/register" className="btn-primary-large">Get Started Today</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SolutionsPage;