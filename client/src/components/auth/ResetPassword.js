import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, {
                token,
                newPassword
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error resetting password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="success-state">
                        <h1>✓ Password Reset Successful!</h1>
                        <p>Your password has been updated.</p>
                        <p>Redirecting to login...</p>
                        <Link to="/login" className="btn-login">Go to Login Now</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <h1>Reset Password</h1>
                <p className="subtitle">Enter your new password below.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-submit">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="links">
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;