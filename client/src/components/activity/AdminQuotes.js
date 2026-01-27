import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminQuotes.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function AdminQuotes() {
    const [pendingQuotes, setPendingQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPendingQuotes();
    }, []);

    const fetchPendingQuotes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/quotes/pending`);
            setPendingQuotes(response.data.quotes);
        } catch (error) {
            console.error('Error fetching pending quotes:', error);
            setError(error.response?.data?.error || 'Error loading quotes');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (quoteId) => {
        try {
            await axios.put(`${API_URL}/quotes/${quoteId}/approve`);
            setPendingQuotes(prev => prev.filter(q => q._id !== quoteId));
        } catch (error) {
            alert('Error approving quote');
        }
    };

    const handleReject = async (quoteId) => {
        try {
            await axios.put(`${API_URL}/quotes/${quoteId}/reject`);
            setPendingQuotes(prev => prev.filter(q => q._id !== quoteId));
        } catch (error) {
            alert('Error rejecting quote');
        }
    };

    const handleDelete = async (quoteId) => {
        if (!window.confirm('Are you sure you want to delete this quote permanently?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/quotes/${quoteId}`);
            setPendingQuotes(prev => prev.filter(q => q._id !== quoteId));
        } catch (error) {
            alert('Error deleting quote');
        }
    };

    if (loading) {
        return <div className="admin-quotes-container"><div className="loading">Loading...</div></div>;
    }

    if (error) {
        return (
            <div className="admin-quotes-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="admin-quotes-container">
            <h1>Pending Quote Approvals</h1>

            {pendingQuotes.length === 0 ? (
                <div className="no-pending">
                    <p>No quotes pending approval</p>
                </div>
            ) : (
                <div className="quotes-list">
                    {pendingQuotes.map(quote => (
                        <div key={quote._id} className="quote-card">
                            <div className="quote-header">
                                <span className="submitted-by">
                                    Submitted by @{quote.submittedBy.username}
                                </span>
                                <span className="submitted-date">
                                    {new Date(quote.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <blockquote className="quote-text">
                                "{quote.text}"
                            </blockquote>

                            <div className="quote-details">
                                <strong>{quote.bookTitle}</strong> by {quote.author}
                            </div>

                            <div className="quote-actions">
                                <button
                                    onClick={() => handleApprove(quote._id)}
                                    className="btn-approve"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(quote._id)}
                                    className="btn-reject"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleDelete(quote._id)}
                                    className="btn-delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminQuotes;