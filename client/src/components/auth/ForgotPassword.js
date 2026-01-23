import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/request-password-reset`, { email });
            setMessage(response.data.message);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error sending reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h1>Forgot Password</h1>
                <p className="subtitle">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-submit">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="links">
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;