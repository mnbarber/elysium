import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './PostThread.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 36 }) {
    if (user?.avatar) {
        return <img src={user.avatar} alt={user.displayName || user.username} className="post-avatar" style={{ width: size, height: size }} />;
    }
    return (
        <div className="post-avatar post-avatar--placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>
            {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
        </div>
    );
}

export default function PostThread({ post, clubId, onUpdated }) {
    const { user, isAuthenticated } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await axios.post(
                `${API_URL}/bookclubs/${clubId}/posts/${post._id}/reply`,
                { content: replyContent.trim() }
            );
            onUpdated(res.data);
            setReplyContent('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post reply.');
        } finally {
            setSubmitting(false);
        }
    };

    const replyCount = post.replies?.length ?? 0;

    return (
        <div className="post-thread">
            <div className="post-thread__header">
                <Avatar user={post.author} size={38} />
                <div className="post-thread__meta">
                    <span className="post-thread__author">
                        {post.author?.displayName || post.author?.username}
                    </span>
                    <span className="post-thread__time">{timeAgo(post.createdAt)}</span>
                </div>
            </div>

            <div className="post-thread__body">
                <h3 className="post-thread__title">{post.title}</h3>
                <p className="post-thread__content">{post.content}</p>
            </div>

            <button
                className="post-thread__toggle"
                onClick={() => setExpanded(prev => !prev)}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {replyCount === 0 ? 'Reply' : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                {replyCount > 0 && (
                    <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                )}
            </button>

            {expanded && (
                <div className="post-thread__replies">
                    {post.replies?.length > 0 && (
                        <div className="replies-list">
                            {post.replies.map(reply => (
                                <div key={reply._id} className="reply">
                                    <Avatar user={reply.author} size={28} />
                                    <div className="reply__body">
                                        <div className="reply__meta">
                                            <span className="reply__author">
                                                {reply.author?.displayName || reply.author?.username}
                                            </span>
                                            <span className="reply__time">{timeAgo(reply.createdAt)}</span>
                                        </div>
                                        <p className="reply__content">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isAuthenticated ? (
                        <form className="reply-form" onSubmit={handleReply}>
                            <Avatar user={user} size={28} />
                            <div className="reply-form__input-wrap">
                                <textarea
                                    className="reply-form__textarea"
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    maxLength={2000}
                                    rows={2}
                                    onInput={e => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                                {error && <span className="reply-form__error">{error}</span>}
                                <div className="reply-form__actions">
                                    <span className="reply-form__char">{2000 - replyContent.length}</span>
                                    <button
                                        type="submit"
                                        className="reply-form__submit"
                                        disabled={submitting || !replyContent.trim()}
                                    >
                                        {submitting ? (
                                            <span className="reply-spinner" />
                                        ) : (
                                            'Post'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <p className="reply-form__signin-note">Sign in to reply.</p>
                    )}
                </div>
            )}
        </div>
    );
}