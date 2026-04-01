import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import VotingPanel from '../clubs/VotingPanel';
import DiscussionBoard from '../clubs/DiscussionBoard';
import './BookClubPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function BookClubPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    const [club, setClub] = useState(null);
    const [tab, setTab] = useState('discussion');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', isPrivate: false, coverImage: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/bookclubs/${id}`)
            .then(r => setClub(r.data))
            .catch(() => setError('Could not load this book club.'))
            .finally(() => setLoading(false));
    }, [id]);

    const isOwner = user && club && club.owner._id === user._id;

    const openEdit = () => {
        setEditForm({
            name: club.name,
            description: club.description || '',
            isPrivate: club.isPrivate,
            coverImage: club.coverImage || '',
        });
        setEditError('');
        setEditOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) { setEditError('Club name is required.'); return; }
        setEditSubmitting(true);
        setEditError('');
        try {
            const res = await axios.patch(`${API_URL}/bookclubs/${id}`, {
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                isPrivate: editForm.isPrivate,
                coverImage: editForm.coverImage.trim() || undefined,
            });
            setClub(res.data);
            setEditOpen(false);
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to update club.');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setDeleteSubmitting(true);
        setDeleteError('');
        try {
            await axios.delete(`${API_URL}/bookclubs/${id}`);
            navigate('/bookclubs');
        } catch (err) {
            setDeleteError(err.response?.data?.error || 'Failed to delete club.');
            setDeleteSubmitting(false);
        }
    };

    if (loading) return (
        <div className="book-club-page">
            <div className="book-club-page__loading">
                <div className="book-club-page__loading-spinner" />
                Loading...
            </div>
        </div>
    );

    if (error) return (
        <div className="book-club-page">
            <div className="book-club-page__error">{error}</div>
        </div>
    );

    return (
        <div className="book-club-page">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <div className="club-info">
                <div className="book-club-page__cover">
                    {club.coverImage
                        ? <img src={club.coverImage} alt={club.name} />
                        : <div className="book-club-page__cover-placeholder">{club.name.charAt(0)}</div>
                    }
                </div>
                <div className="book-club-page__info">
                    <h1 className="book-club-page__name">{club.name}</h1>
                    {club.description && (
                        <p className="book-club-page__description">{club.description}</p>
                    )}
                    <div className="book-club-page__meta-row">
                        <span className={`book-club-page__meta-chip ${club.isPrivate ? 'book-club-page__meta-chip--private' : ''}`}>
                            {club.isPrivate ? '🔒 Private' : '🌐 Public'}
                        </span>
                        <span className="book-club-page__meta-chip">
                            👥 {club.members.length} {club.members.length === 1 ? 'member' : 'members'}
                        </span>
                    </div>

                    {/* Owner actions */}
                    {isOwner && (
                        <div className="book-club-page__actions">
                            <button className="book-club-page__btn book-club-page__btn--secondary" onClick={openEdit}>
                                ✏️ Edit Club
                            </button>
                            <button className="book-club-page__btn book-club-page__btn--danger" onClick={() => setDeleteConfirmOpen(true)}>
                                🗑 Delete Club
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <nav className="book-club-page__tabs">
                {['discussion', 'voting', 'members'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`book-club-page__tab ${tab === t ? 'book-club-page__tab--active' : ''}`}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </nav>

            {/* Tab panels */}
            <div className="book-club-page__panel">
                {tab === 'discussion' && <DiscussionBoard clubId={id} />}
                {tab === 'voting'     && <VotingPanel clubId={id} />}
                {tab === 'members'    && (
                    <>
                        <h2 className="book-club-page__members-heading">Members</h2>
                        <div className="book-club-page__members-grid">
                            {club.members.map(m => (
                                <Link to={`/profile/${m.username}`} key={m._id} className="book-club-page__member-card">
                                    {m.avatar
                                        ? <img src={m.avatar} alt={m.displayName || m.username} className="book-club-page__member-avatar" />
                                        : <div className="book-club-page__member-avatar--placeholder">
                                            {(m.displayName || m.username || '?').charAt(0).toUpperCase()}
                                          </div>
                                    }
                                    <div className="book-club-page__member-info">
                                        <div className="book-club-page__member-name">{m.displayName || m.username}</div>
                                        {club.owner._id === m._id && (
                                            <span className="book-club-page__member-owner-tag">Owner</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Edit Modal ────────────────────────────────────────────────── */}
            {editOpen && (
                <div className="club-modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="club-modal" onClick={e => e.stopPropagation()}>
                        <div className="club-modal__header">
                            <h2 className="club-modal__title">Edit Club</h2>
                            <button className="club-modal__close" onClick={() => setEditOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="club-modal__form" noValidate>
                            {editError && <div className="club-modal__error">{editError}</div>}

                            <div className="club-modal__field">
                                <label className="club-modal__label">Club Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    className="club-modal__input"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    maxLength={80}
                                    autoFocus
                                />
                            </div>

                            <div className="club-modal__field">
                                <label className="club-modal__label">
                                    Description
                                    <span className="club-modal__char">{500 - editForm.description.length} left</span>
                                </label>
                                <textarea
                                    name="description"
                                    className="club-modal__textarea"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                    maxLength={500}
                                    rows={3}
                                />
                            </div>

                            <div className="club-modal__field">
                                <label className="club-modal__label">Cover Image URL</label>
                                <input
                                    name="coverImage"
                                    type="url"
                                    className="club-modal__input"
                                    value={editForm.coverImage}
                                    onChange={handleEditChange}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="club-modal__field club-modal__field--row">
                                <label className="club-modal__label">Private club</label>
                                <input
                                    name="isPrivate"
                                    type="checkbox"
                                    className="club-modal__checkbox"
                                    checked={editForm.isPrivate}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="club-modal__actions">
                                <button type="button" className="club-modal__btn club-modal__btn--cancel" onClick={() => setEditOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="club-modal__btn club-modal__btn--submit" disabled={editSubmitting}>
                                    {editSubmitting ? <><span className="club-modal__spinner" /> Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
            {deleteConfirmOpen && (
                <div className="club-modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
                    <div className="club-modal club-modal--narrow" onClick={e => e.stopPropagation()}>
                        <div className="club-modal__header">
                            <h2 className="club-modal__title">Delete Club</h2>
                            <button className="club-modal__close" onClick={() => setDeleteConfirmOpen(false)}>✕</button>
                        </div>
                        <p className="club-modal__confirm-text">
                            Are you sure you want to delete <strong>{club.name}</strong>? This will permanently remove the club, all discussions, and all votes. This cannot be undone.
                        </p>
                        {deleteError && <div className="club-modal__error">{deleteError}</div>}
                        <div className="club-modal__actions">
                            <button className="club-modal__btn club-modal__btn--cancel" onClick={() => setDeleteConfirmOpen(false)}>
                                Cancel
                            </button>
                            <button className="club-modal__btn club-modal__btn--danger" onClick={handleDelete} disabled={deleteSubmitting}>
                                {deleteSubmitting ? <><span className="club-modal__spinner" /> Deleting...</> : 'Yes, Delete Club'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}