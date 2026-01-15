import React, { useState } from 'react';
import axios from 'axios';
import './Contact.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [setLoading] = useState(false);
    const [setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/contact`, formData);
            console.log('Contact form response:', response.data);
            setSubmitted(true);

            setTimeout(() => {
                setFormData({ name: '', email: '', subject: '', message: '' });
                setSubmitted(false);
            }, 5000);
        } catch (err) {
            console.error('Contact form error:', err);
            setError(err.response?.data?.error || 'Error sending message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-container">
            <div className="contact-header">
                <h1>Contact Us ♥</h1>
                <p>Have a question, suggestion, or issue? We'd love to hear from you!</p>
            </div>

            {submitted ? (
                <div className="success-message-box">
                    <h2>Message Sent!</h2>
                    <p>Thank you for contacting us. We'll get back to you as soon as possible.</p>
                </div>
            ) : (
                <div className="contact-content">
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Subject *</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="What's this about?"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Message *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us more..."
                                rows="6"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-submit">
                            Send Message
                        </button>
                    </form>

                    <div className="contact-info">
                        <h3>Other Ways to Reach Us</h3>

                        <div className="info-item">
                            <h4>Email</h4>
                            <p>elysiumbookshelp@gmail.com</p>
                        </div>

                        <div className="info-item">
                            <h4>Response Time</h4>
                            <p>We typically respond within 24-48 hours</p>
                        </div>

                        <div className="info-item">
                            <h4>Bug Reports</h4>
                            <p>Please include as much detail as possible, including screenshots if relevant</p>
                        </div>

                        <div className="info-item">
                            <h4>Feature Requests</h4>
                            <p>We love hearing your ideas for improving Elysium!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Contact;