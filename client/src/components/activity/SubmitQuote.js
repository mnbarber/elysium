import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SubmitQuote.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function SubmitQuote() {
    const [formData, setFormData] = useState({
        text: '',
        author: '',
        source: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [mySubmissions, setMySubmissions] = useState([]);

    useEffect(() => {
        fetchMySubmissions();
    }, []);

    const fetchMySubmissions = async () => {
        try {
            const response = await axios.get(`${API_URL}/quotes/my-submissions`);
            setMySubmissions(response.data.quotes);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await axios.post(`${API_URL}/quotes/submit`, formData);
            setSuccess(true);
            setFormData({ text: '', author: '', source: '' });
            fetchMySubmissions();

            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            setError(error.response?.data?.error || 'Error submitting quote');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Pending Review', class: 'status-pending' },
            approved: { text: 'Approved ✓', class: 'status-approved' },
            rejected: { text: 'Rejected', class: 'status-rejected' }
        };
        return badges[status] || badges.pending;
    };

    return (
        <div className="submit-quote-container">
            <div className="submit-quote-header">
                <h1>Submit a Quote</h1>
                <p className="subtitle">Share your favorite book quotes with the community!</p>
            </div>

            {success && (
                <div className="success-message">
                    ✓ Quote submitted successfully! It will appear on the home page after approval.
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="submit-quote-content">
                <div className="quote-form-section">
                    <form onSubmit={handleSubmit} className="quote-form">
                        <div className="form-group">
                            <label htmlFor="text">Quote Text *</label>
                            <textarea
                                id="text"
                                name="text"
                                value={formData.text}
                                onChange={handleChange}
                                placeholder="Enter the quote..."
                                maxLength={500}
                                rows={6}
                                required
                            />
                            <span className="char-count">{formData.text.length}/500</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="source">Source(Book Title) *</label>
                            <input
                                type="text"
                                id="source"
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                placeholder="e.g., Clockwork Angel"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="author">Author *</label>
                            <input
                                type="text"
                                id="author"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="e.g., Cassandra Clare"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Quote'}
                        </button>
                    </form>

                    <div className="quote-guidelines">
                        <h3>📋 Guidelines</h3>
                        <ul>
                            <li>Quotes must be 500 characters or less</li>
                            <li>Please ensure accuracy - double-check the quote text</li>
                            <li>Include the correct source(book title) and author</li>
                            <li>All submissions are reviewed before appearing on the site</li>
                            <li>Keep quotes family-friendly and appropriate</li>
                        </ul>
                    </div>
                </div>

                <div className="my-submissions-section">
                    <h2>Your Submissions</h2>
                    {mySubmissions.length === 0 ? (
                        <div className="no-submissions">
                            <p>You haven't submitted any quotes yet.</p>
                        </div>
                    ) : (
                        <div className="submissions-list">
                            {mySubmissions.map(quote => {
                                const badge = getStatusBadge(quote.status);
                                return (
                                    <div key={quote._id} className="submission-item">
                                        <div className="submission-header">
                                            <span className={`status-badge ${badge.class}`}>
                                                {badge.text}
                                            </span>
                                            <span className="submission-date">
                                                {new Date(quote.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <blockquote>"{quote.text}"</blockquote>
                                        <div className="submission-attribution">
                                            <strong>{quote.source}</strong> by {quote.author}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="back-link">
                <Link to="/">← Back to Home</Link>
            </div>
        </div>
    );
}

export default SubmitQuote;