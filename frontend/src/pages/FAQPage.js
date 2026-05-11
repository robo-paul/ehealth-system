// src/pages/FAQPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FAQPage.css';

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            category: "Account & Registration",
            questions: [
                {
                    q: "How do I create an account?",
                    a: "Click on the 'Register' button on the homepage. Fill in your personal details including your name, email, and create a secure password. You'll receive a verification email to confirm your account."
                },
                {
                    q: "What if I forget my password?",
                    a: "Click on 'Forgot Password' on the login page. Enter your registered email address, and we'll send you a password reset link. Follow the instructions to create a new password."
                },
                {
                    q: "Can I have multiple accounts?",
                    a: "Each individual should have their own account for security and privacy reasons. Family members can be linked through family plans under a primary account holder."
                },
                {
                    q: "How do I update my profile information?",
                    a: "Log in to your account, go to 'Profile' from the dashboard, and click 'Edit Profile'. You can update your contact details, emergency contacts, and personal information."
                }
            ]
        },
        {
            category: "Security & Privacy",
            questions: [
                {
                    q: "Is my health data secure?",
                    a: "Yes! We use military-grade AES-256 encryption for all data at rest and in transit. Your health records are protected with biometric fingerprint authentication for an extra layer of security."
                },
                {
                    q: "How does fingerprint authentication work?",
                    a: "When you register your fingerprint, we create a unique mathematical template of your fingerprint pattern. This template is stored securely and cannot be reverse-engineered to recreate your actual fingerprint."
                },
                {
                    q: "Who has access to my medical records?",
                    a: "Only you and authorized healthcare providers you've explicitly granted access to can view your medical records. You can manage access permissions from your profile settings."
                },
                {
                    q: "What happens if I lose my fingerprint access?",
                    a: "You can always use your password as a backup authentication method. For security reasons, you'll need to verify your identity through email to re-enable fingerprint access."
                }
            ]
        },
        {
            category: "Health Records",
            questions: [
                {
                    q: "How do I add a new health record?",
                    a: "From your dashboard, click on 'Health Records', then '+ Add Health Record'. Fill in the details including date, type of record, and any relevant notes. You can also upload attachments like lab results."
                },
                {
                    q: "Can I export my health records?",
                    a: "Yes! You can export your health records as PDF files for personal use or to share with healthcare providers. Look for the 'Export' option in the health records section."
                },
                {
                    q: "How long are my records kept?",
                    a: "Your health records are stored indefinitely for your reference. You can delete records at any time, but please note that deleted records cannot be recovered."
                },
                {
                    q: "Can I upload external medical documents?",
                    a: "Yes, you can upload PDFs, images, and other medical documents to your health records. Supported formats include PDF, JPG, PNG, and DOC files up to 10MB."
                }
            ]
        },
        {
            category: "Appointments",
            questions: [
                {
                    q: "How do I schedule an appointment?",
                    a: "Navigate to the 'Appointments' tab in your dashboard. Select your preferred date, time, and doctor. You'll receive a confirmation email once your appointment is booked."
                },
                {
                    q: "Can I cancel or reschedule an appointment?",
                    a: "Yes, you can cancel or reschedule appointments up to 24 hours before the scheduled time. Go to 'Appointments', select the appointment, and choose 'Cancel' or 'Reschedule'."
                },
                {
                    q: "What if I need an urgent appointment?",
                    a: "For urgent medical needs, please call our emergency hotline directly at +263 782 000 055. For non-emergency urgent appointments, you can request a same-day appointment through your dashboard."
                },
                {
                    q: "How do I know if my appointment is confirmed?",
                    a: "You'll receive an email confirmation immediately after booking. You can also view all confirmed appointments in your dashboard's 'Appointments' section."
                }
            ]
        },
        {
            category: "Prescriptions",
            questions: [
                {
                    q: "How do I request a prescription refill?",
                    a: "Go to 'Prescriptions' in your dashboard, find the medication you need refilled, and click 'Request Refill'. Your doctor will review and approve the request."
                },
                {
                    q: "How many refills can I request?",
                    a: "Refill limits are set by your prescribing doctor and vary by medication. Your available refills are displayed next to each prescription in your dashboard."
                },
                {
                    q: "What if my prescription is expired?",
                    a: "Expired prescriptions cannot be refilled. You'll need to schedule an appointment with your doctor for a new evaluation and prescription."
                },
                {
                    q: "Can I view my prescription history?",
                    a: "Yes, all your prescriptions (active and past) are stored in the 'Prescriptions' section. You can view details including medication name, dosage, and prescribing doctor."
                }
            ]
        },
        {
            category: "Billing & Payments",
            questions: [
                {
                    q: "How do I make a payment?",
                    a: "Navigate to 'Billing' in your dashboard. You can view outstanding invoices and make payments using credit/debit card, mobile money, or bank transfer."
                },
                {
                    q: "What payment methods are accepted?",
                    a: "We accept Visa, Mastercard, American Express, EcoCash, OneMoney, and bank transfers. All payments are processed securely through our encrypted payment gateway."
                },
                {
                    q: "How do I get an invoice?",
                    a: "Invoices are automatically generated for all payments. You can download them from the 'Billing' section. Invoices are also sent to your registered email."
                },
                {
                    q: "What is your refund policy?",
                    a: "Refunds are processed within 7-10 business days for eligible payments. Please contact our billing department at billing@ehealth.com for refund requests."
                }
            ]
        },
        {
            category: "Technical Support",
            questions: [
                {
                    q: "The app is not loading properly. What should I do?",
                    a: "Try clearing your browser cache and cookies. If the issue persists, try using a different browser or device. Contact our technical support if the problem continues."
                },
                {
                    q: "I'm not receiving email notifications. Why?",
                    a: "Check your spam folder. Add no-reply@ehealth.com to your contacts. Verify that your email address is correct in your profile settings."
                },
                {
                    q: "How do I enable fingerprint authentication?",
                    a: "Go to 'Profile' → 'Security Settings' → 'Fingerprint Authentication'. Follow the prompts to register your fingerprint. You'll need a compatible fingerprint sensor."
                },
                {
                    q: "The fingerprint sensor isn't responding. What's wrong?",
                    a: "Ensure the sensor is properly connected to your device. Try cleaning the sensor surface. If using a USB sensor, try a different USB port. Restart your device if needed."
                }
            ]
        },
        {
            category: "Partnerships & Providers",
            questions: [
                {
                    q: "How can my practice join your network?",
                    a: "Please contact our partnerships team at partners@ehealth.com. We'll schedule a consultation to discuss integration options and requirements."
                },
                {
                    q: "What are the requirements for healthcare providers?",
                    a: "Providers must have a valid medical license, malpractice insurance, and comply with our security and privacy standards. A background verification is required."
                },
                {
                    q: "How do I access the provider portal?",
                    a: "Registered healthcare providers can log in through the provider portal at providers.ehealth.com. Contact support if you need access credentials."
                }
            ]
        }
    ];

    const toggleFAQ = (categoryIndex, questionIndex) => {
        const key = `${categoryIndex}-${questionIndex}`;
        setOpenIndex(openIndex === key ? null : key);
    };

    return (
        <div className="faq-page">
            <div className="faq-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about our services</p>
                </div>
            </div>

            <div className="faq-container">
                <div className="faq-categories">
                    {faqs.map((category, catIndex) => (
                        <div key={catIndex} className="faq-category">
                            <h2>{category.category}</h2>
                            <div className="faq-list">
                                {category.questions.map((faq, qIndex) => {
                                    const key = `${catIndex}-${qIndex}`;
                                    const isOpen = openIndex === key;
                                    return (
                                        <div 
                                            key={qIndex} 
                                            className={`faq-item ${isOpen ? 'open' : ''}`}
                                            onClick={() => toggleFAQ(catIndex, qIndex)}
                                        >
                                            <div className="faq-question">
                                                <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                                                <h3>{faq.q}</h3>
                                            </div>
                                            {isOpen && (
                                                <div className="faq-answer">
                                                    <p>{faq.a}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="faq-footer">
                    <h3>Still have questions?</h3>
                    <p>Can't find the answer you're looking for? Please contact our support team.</p>
                    <div className="faq-footer-buttons">
                        <Link to="/contact" className="btn-primary">Contact Us</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;