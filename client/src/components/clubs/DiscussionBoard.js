import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import PostThread from './PostThread';
import './DiscussionBoard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const EMPTY_FORM = { title: '', content: '' };

export default function DiscussionBoard({ clubId }) {
    const { user, isAuthenticated } = useAuth();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [composing, setComposing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/bookclubs/${clubId}/posts`)
            .then(res => setPosts(res.data))
            .catch(() => setError('Failed to load discussions.'))
            .finally(() => setLoading(false));
    }, [clubId]);

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'A title is required.';
        else if (form.title.trim().length > 200) errs.title = 'Title must be 200 characters or fewer.';
        if (!form.content.trim()) errs.content = 'Post content is required.';
        else if (form.content.trim().length > 5000) errs.content = 'Content must be 5000 characters or fewer.';
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await axios.post(`${API_URL}/bookclubs/${clubId}/posts`, {
                title: form.title.trim(),
                content: form.content.trim(),
            });
            setPosts(prev => [res.data, ...prev]);
            setForm(EMPTY_FORM);
            setComposing(false);
        } catch (err) {
            setSubmitError(err.response?.data?.error || 'Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const cancelCompose = () => {
        setComposing(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
        setSubmitError('');
    };

    return (
        <div className="discussion-board">

            <div className="discussion-board__toolbar">
                <h2 className="discussion-board__heading">
                    Discussion
                    {posts.length > 0 && <span className="discussion-board__count">{posts.length}</span>}
                </h2>
                {isAuthenticated && !composing && (
                    <button className="discussion-board__new-btn" onClick={() => setComposing(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Post
                    </button>
                )}
            </div>

            {composing && (
                <form className="discussion-board__compose" onSubmit={handleSubmit} noValidate>
                    <h3 className="discussion-board__compose-heading">New Discussion Post</h3>

                    {submitError && (
                        <div className="discussion-board__submit-error">{submitError}</div>
                    )}

                    <div className={`discussion-field ${formErrors.title ? 'discussion-field--error' : ''}`}>
                        <label className="discussion-label" htmlFor="post-title">Title</label>
                        <input
                            id="post-title"
                            name="title"
                            type="text"
                            className="discussion-input"
                            placeholder="What do you want to discuss?"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={200}
                            autoFocus
                        />
                        {formErrors.title && <span className="discussion-field-error">{formErrors.title}</span>}
                    </div>

                    <div className={`discussion-field ${formErrors.content ? 'discussion-field--error' : ''}`}>
                        <label className="discussion-label" htmlFor="post-content">
                            Content
                            <span className="discussion-char-count"
                                style={{ color: (5000 - form.content.length) < 200 ? '#c0392b' : undefined }}>
                                {5000 - form.content.length} left
                            </span>
                        </label>
                        <textarea
                            id="post-content"
                            name="content"
                            className="discussion-textarea"
                            placeholder="Share your thoughts, questions, or reactions..."
                            value={form.content}
                            onChange={handleChange}
                            maxLength={5000}
                            rows={5}
                        />
                        {formErrors.content && <span className="discussion-field-error">{formErrors.content}</span>}
                    </div>

                    <div className="discussion-board__compose-actions">
                        <button type="button" className="discussion-btn discussion-btn--cancel" onClick={cancelCompose}>
                            Cancel
                        </button>
                        <button type="submit" className="discussion-btn discussion-btn--submit" disabled={submitting}>
                            {submitting ? <><span className="discussion-spinner" /> Posting...</> : 'Post'}
                        </button>
                    </div>
                </form>
            )}

            {loading && (
                <div className="discussion-board__state">
                    <div className="discussion-board__loading">
                        <span className="discussion-spinner discussion-spinner--lg" />
                        Loading discussions...
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="discussion-board__state discussion-board__state--error">{error}</div>
            )}

            {!loading && !error && posts.length === 0 && (
                <div className="discussion-board__empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>No posts yet. Be the first to start a discussion!</p>
                    {isAuthenticated && !composing && (
                        <button className="discussion-board__new-btn" onClick={() => setComposing(true)}>
                            Start a Discussion
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && posts.length > 0 && (
                <div className="discussion-board__posts">
                    {posts.map(post => (
                        <PostThread
                            key={post._id}
                            post={post}
                            clubId={clubId}
                            onUpdated={handlePostUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}