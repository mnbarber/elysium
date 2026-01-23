import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './Settings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        fetchUserSettings();
    }, []);

    const fetchUserSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/auth/me`);
            setEmail(response.data.email || '');
            setUsername(response.data.username || '');
            setIsPublic(response.data.profile?.isPublic !== false);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateEmail = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            alert('Email cannot be empty');
            return;
        }

        try {
            setSaving(true);
            await axios.put(`${API_URL}/auth/email`, { email });
            alert('Email updated successfully! Please log in again.');
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Error updating email:', error);
            alert(error.response?.data?.error || 'Error updating email');
        } finally {
            setSaving(false);
        }
    };

    const updateUsername = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            alert('Username cannot be empty');
            return;
        }

        if (username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }

        try {
            setSaving(true);
            await axios.put(`${API_URL}/auth/username`, { username });
            alert('Username updated successfully!');
        } catch (error) {
            console.error('Error updating username:', error);
            alert(error.response?.data?.error || 'Error updating username');
        } finally {
            setSaving(false);
        }
    };

    const updatePassword = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            setSaving(true);
            await axios.put(`${API_URL}/auth/password`, {
                currentPassword,
                newPassword
            });

            alert('Password updated successfully! Please log in again.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Error updating password:', error);
            alert(error.response?.data?.error || 'Error updating password');
        } finally {
            setSaving(false);
        }
    };

    const updatePrivacy = async () => {
        try {
            setSaving(true);
            await axios.put(`${API_URL}/auth/privacy`, { isPublic: !isPublic });
            setIsPublic(!isPublic);
            alert(`Profile is now ${!isPublic ? 'public' : 'private'}`);
        } catch (error) {
            console.error('Error updating privacy:', error);
            alert('Error updating privacy settings');
        } finally {
            setSaving(false);
        }
    };

    const deleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            alert('Please type DELETE to confirm');
            return;
        }

        if (!window.confirm('Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/auth/account`);
            alert('Your account has been deleted.');
            logout();
            navigate('/');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account');
        }
    };

    if (loading) {
        return <div className="loading">Loading settings...</div>;
    }

    return (
        <div className="settings-container">
            <h1>⛯ Account Settings</h1>

            <div className="settings-section">
                <h2>Email Address</h2>
                <p className="settings-description">
                    Changing your email will log you out. You'll need to log in with your new email.
                </p>
                <form onSubmit={updateEmail}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Update Email'}
                    </button>
                </form>
            </div>

            <div className="settings-section">
                <h2>Username</h2>
                <form onSubmit={updateUsername}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                        />
                    </div>
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Update Username'}
                    </button>
                </form>
            </div>

            <div className="settings-section">
                <h2>Change Password</h2>
                <p className="settings-description">
                    Changing your password will log you out for security.
                </p>
                <form onSubmit={updatePassword}>
                    <div className="form-group">
                        <label htmlFor="current-password">Current Password</label>
                        <input
                            type="password"
                            id="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">New Password</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <div className="settings-section">
                <h2>Privacy Settings</h2>
                <div className="privacy-toggle">
                    <div className="toggle-info">
                        <h3>Profile Visibility</h3>
                        <p className="settings-description">
                            {isPublic
                                ? 'Your profile is public. Anyone can see your reading activity and reviews.'
                                : 'Your profile is private. Only your friends can see your reading activity.'}
                        </p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={updatePrivacy}
                            disabled={saving}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-section danger-zone">
                <h2>⚠ Danger Zone</h2>
                <div className="danger-content">
                    <div>
                        <h3>Delete Account</h3>
                        <p className="settings-description">
                            Once you delete your account, there is no going back. All your data will be permanently deleted.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="btn-danger"
                    >
                        Delete Account
                    </button>
                </div>

                {showDeleteConfirm && (
                    <div className="delete-confirm">
                        <p className="delete-warning">
                            This will permanently delete your account, including:
                        </p>
                        <ul>
                            <li>All your libraries and reading data</li>
                            <li>All your reviews and ratings</li>
                            <li>All your reading goals and stats</li>
                            <li>Your profile and friend connections</li>
                        </ul>
                        <div className="form-group">
                            <label htmlFor="delete-confirm">
                                Type <strong>DELETE</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                id="delete-confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                            />
                        </div>
                        <div className="delete-actions">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteAccount}
                                className="btn-delete-confirm"
                                disabled={deleteConfirmText !== 'DELETE'}
                            >
                                Permanently Delete Account
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;