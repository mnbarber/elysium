import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MyLists.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function MyLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newList, setNewList] = useState({
        title: '',
        description: '',
        isPublic: false
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserLists();
    }, []);

    const fetchUserLists = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/lists/user`);
            setLists(response.data.lists);
        } catch (err) {
            console.error('Error fetching lists:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async (e) => {
        e.preventDefault();
        setError('');

        if (!newList.title.trim()) {
            setError('Title is required');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/lists`, newList);
            setLists([response.data.list, ...lists]);
            setShowCreateModal(false);
            setNewList({ title: '', description: '', isPublic: false });
        } catch (err) {
            setError(err.response?.data?.error || 'Error creating list');
        }
    };

    const handleDeleteList = async (listId) => {
        if (!window.confirm('Are you sure you want to delete this list?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/lists/${listId}`);
            setLists(lists.filter(list => list._id !== listId));
        } catch (err) {
            alert('Error deleting list');
        }
    };

    const getPendingSuggestionsCount = (list) => {
        return list.suggestions?.filter(s => s.status === 'pending').length || 0;
    };

    if (loading) {
        return <div className="loading">Loading your lists...</div>;
    }

    return (
        <div className="my-lists-container">
            <div className="lists-header">
                <h1>My Lists</h1>
                <div className="header-actions">
                    <Link to="/lists/browse" className="btn-browse">
                        Browse Public Lists
                    </Link>
                    <button onClick={() => setShowCreateModal(true)} className="btn-create">
                        + Create New List
                    </button>
                </div>
            </div>

            {lists.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't created any lists yet.</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn-create-large">
                        Create Your First List!
                    </button>
                </div>
            ) : (
                <div className="lists-grid">
                    {lists.map(list => (
                        <div key={list._id} className="list-card">
                            <Link to={`/lists/${list._id}`} className="list-card-link">
                                <div className="list-card-header">
                                    <h3>{list.title}</h3>
                                    <span className={`visibility-badge ${list.isPublic ? 'public' : 'private'}`}>
                                        {list.isPublic ? 'Public' : 'Private'}
                                    </span>
                                </div>

                                {list.description && (
                                    <p className="list-description">{list.description}</p>
                                )}

                                <div className="list-stats">
                                    <span className="stat">
                                        {list.books?.length || 0} books
                                    </span>
                                    {list.isPublic && getPendingSuggestionsCount(list) > 0 && (
                                        <span className="stat suggestions">
                                            {getPendingSuggestionsCount(list)} new suggestions
                                        </span>
                                    )}
                                </div>

                                <div className="list-books-preview">
                                    {list.books?.slice(0, 4).map(book => (
                                        <div key={book.key} className="book-cover-mini">
                                            {book.coverUrl ? (
                                                <img src={book.coverUrl} alt={book.title} />
                                            ) : (
                                                <div className="no-cover-mini">📕</div>
                                            )}
                                        </div>
                                    ))}
                                    {list.books?.length > 4 && (
                                        <div className="more-books">+{list.books.length - 4}</div>
                                    )}
                                </div>
                            </Link>

                            <div className="list-card-actions">
                                <button
                                    onClick={() => handleDeleteList(list._id)}
                                    className="btn-delete"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Create New List</h2>
                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleCreateList}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={newList.title}
                                    onChange={e => setNewList({ ...newList, title: e.target.value })}
                                    placeholder="My Favorite Sci-Fi Books"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newList.description}
                                    onChange={e => setNewList({ ...newList, description: e.target.value })}
                                    placeholder="A curated collection of..."
                                    maxLength={500}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={newList.isPublic}
                                        onChange={e => setNewList({ ...newList, isPublic: e.target.checked })}
                                    />
                                    Make this list public (others can view and suggest books)
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Create List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyLists;