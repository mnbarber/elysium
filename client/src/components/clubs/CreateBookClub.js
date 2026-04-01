import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './CreateBookClub.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function CreateBookClubPage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        description: '',
        isPrivate: false,
        coverImage: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    if (!isAuthenticated) {
        return (
            <div className="create-club-page">
                <div className="create-club-auth-gate">
                    <p>You need to be signed in to create a book club.</p>
                    <Link to="/login" className="create-club-btn create-club-btn--primary">Sign In</Link>
                </div>
            </div>
        );
    }

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Club name is required.';
        else if (form.name.trim().length < 3) errs.name = 'Name must be at least 3 characters.';
        else if (form.name.trim().length > 80) errs.name = 'Name must be 80 characters or fewer.';
        if (form.description.length > 500) errs.description = 'Description must be 500 characters or fewer.';
        if (form.coverImage && !/^https?:\/\/.+/.test(form.coverImage.trim())) {
            errs.coverImage = 'Cover image must be a valid URL starting with http:// or https://';
        }
        return errs;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        setServerError('');
        try {
            const res = await axios.post(`${API_URL}/bookclubs`, {
                name: form.name.trim(),
                description: form.description.trim(),
                isPrivate: form.isPrivate,
                coverImage: form.coverImage.trim() || undefined,
            });
            console.log('Book club created successfully:', res.data);
            navigate(`/bookclubs/${res.data._id}`);
        } catch (err) {
            setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const charLeft = 500 - form.description.length;

    return (
        <div className="create-club-page">
            <div className="create-club-container">

                <Link to="/bookclubs" className="create-club-back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    All Book Clubs
                </Link>

                <div className="create-club-header">
                    <div className="create-club-header__icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="create-club-header__title">Start a Book Club</h1>
                        <p className="create-club-header__subtitle">Gather readers, pick monthly books, and discuss together.</p>
                    </div>
                </div>

                <form className="create-club-form" onSubmit={handleSubmit} noValidate>

                    {serverError && (
                        <div className="create-club-error-banner">{serverError}</div>
                    )}

                    <div className={`create-club-field ${errors.name ? 'create-club-field--error' : ''}`}>
                        <label className="create-club-label" htmlFor="name">
                            Club Name <span className="create-club-required">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="create-club-input"
                            placeholder="e.g. Midnight Pages Society"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={80}
                            autoFocus
                        />
                        {errors.name && <span className="create-club-field-error">{errors.name}</span>}
                    </div>

                    <div className={`create-club-field ${errors.description ? 'create-club-field--error' : ''}`}>
                        <label className="create-club-label" htmlFor="description">
                            Description
                            <span className="create-club-char-count" style={{ color: charLeft < 50 ? '#c0392b' : undefined }}>
                                {charLeft} left
                            </span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="create-club-textarea"
                            placeholder="What's this club about? What genres or themes do you focus on?"
                            value={form.description}
                            onChange={handleChange}
                            maxLength={500}
                            rows={4}
                        />
                        {errors.description && <span className="create-club-field-error">{errors.description}</span>}
                    </div>

                    <div className={`create-club-field ${errors.coverImage ? 'create-club-field--error' : ''}`}>
                        <label className="create-club-label" htmlFor="coverImage">Cover Image URL</label>
                        <input
                            id="coverImage"
                            name="coverImage"
                            type="url"
                            className="create-club-input"
                            placeholder="https://..."
                            value={form.coverImage}
                            onChange={handleChange}
                        />
                        {errors.coverImage && <span className="create-club-field-error">{errors.coverImage}</span>}
                        {form.coverImage && !errors.coverImage && (
                            <div className="create-club-cover-preview">
                                <img
                                    src={form.coverImage}
                                    alt="Cover preview"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="create-club-field">
                        <label className="create-club-label">Visibility</label>
                        <div className="create-club-visibility">
                            <button
                                type="button"
                                className={`visibility-option ${!form.isPrivate ? 'visibility-option--active' : ''}`}
                                onClick={() => setForm(prev => ({ ...prev, isPrivate: false }))}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                <div>
                                    <strong>Public</strong>
                                    <span>Anyone can find and join this club</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className={`visibility-option ${form.isPrivate ? 'visibility-option--active' : ''}`}
                                onClick={() => setForm(prev => ({ ...prev, isPrivate: true }))}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <div>
                                    <strong>Private</strong>
                                    <span>Only people you invite can join</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="create-club-actions">
                        <Link to="/bookclubs" className="create-club-btn create-club-btn--secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="create-club-btn create-club-btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="create-club-spinner" />
                                    Creating...
                                </>
                            ) : (
                                'Create Club'
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}