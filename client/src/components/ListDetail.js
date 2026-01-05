import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ListDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ListDetail() {
    const { listId } = useParams();
    const navigate = useNavigate();
    const [list, setList] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [suggestionNote, setSuggestionNote] = useState('');

    useEffect(() => {
        fetchList();
    }, [listId]);

    const fetchList = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/lists/${listId}`);
            setList(response.data.list);
            setIsOwner(response.data.isOwner);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error loading list');
        } finally {
            setLoading(false);
        }
    };

    const searchBooks = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            const response = await axios.get(`${API_URL}/books/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data.docs || []);
        } catch (err) {
            console.error('Error searching books:', err);
        } finally {
            setSearching(false);
        }
    };

    const addBookToList = async (book) => {
        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author_name?.[0] || 'Unknown',
                coverUrl: book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : null
            };

            await axios.post(`${API_URL}/lists/${listId}/books`, { book: bookData });
            setShowAddBookModal(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchList();
            alert('Book added to list!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error adding book');
        }
    };

    const removeBook = async (bookKey) => {
        if (!window.confirm('Remove this book from the list?')) return;

        try {
            await axios.delete(`${API_URL}/lists/${listId}/books/${encodeURIComponent(bookKey)}`);
            fetchList();
        } catch (err) {
            alert('Error removing book');
        }
    };

    const suggestBook = async (book) => {
        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author_name?.[0] || 'Unknown',
                coverUrl: book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : null
            };

            await axios.post(`${API_URL}/lists/${listId}/suggest`, {
                book: bookData,
                note: suggestionNote
            });

            setShowSuggestModal(false);
            setSearchQuery('');
            setSearchResults([]);
            setSuggestionNote('');
            alert('Book suggestion sent!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error suggesting book');
        }
    };

    const handleSuggestion = async (suggestionId, action) => {
        try {
            await axios.post(`${API_URL}/lists/${listId}/suggestions/${suggestionId}/${action}`);
            fetchList();
            alert(`Suggestion ${action}ed!`);
        } catch (err) {
            alert(`Error ${action}ing suggestion`);
        }
    };

    const toggleVisibility = async () => {
        try {
            await axios.put(`${API_URL}/lists/${listId}`, {
                ...list,
                isPublic: !list.isPublic
            });
            fetchList();
        } catch (err) {
            alert('Error updating list');
        }
    };

    if (loading) {
        return <div className="loading">Loading list...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>{error}</h2>
                <button onClick={() => navigate('/lists')}>Back to Lists</button>
            </div>
        );
    }

    if (!list) {
        return <div className="error-container">List not found</div>;
    }

    const pendingSuggestions = list.suggestions?.filter(s => s.status === 'pending') || [];

    return (
        <div className="list-detail-container">
            <button className="back-button" onClick={() => navigate('/lists')}>
                ← Back to My Lists
            </button>

            <div className="list-header">
                <div className="list-title-section">
                    <h1>{list.title}</h1>
                    <span className={`visibility-badge ${list.isPublic ? 'public' : 'private'}`}>
                        {list.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>

                {list.description && <p className="list-description">{list.description}</p>}

                <div className="list-meta">
                    <span>Created by {list.userId.profile?.displayName || list.userId.username}</span>
                    <span>•</span>
                    <span>{list.books?.length || 0} books</span>
                    {isOwner && pendingSuggestions.length > 0 && (
                        <>
                            <span>•</span>
                            <span className="pending-count">{pendingSuggestions.length} pending suggestions</span>
                        </>
                    )}
                </div>

                <div className="list-actions">
                    {isOwner && (
                        <>
                            <button onClick={() => setShowAddBookModal(true)} className="btn-primary">
                                + Add Book
                            </button>
                            <button onClick={toggleVisibility} className="btn-secondary">
                                Make {list.isPublic ? 'Private' : 'Public'}
                            </button>
                        </>
                    )}
                    {!isOwner && list.isPublic && (
                        <button onClick={() => setShowSuggestModal(true)} className="btn-primary">
                            Suggest a Book
                        </button>
                    )}
                </div>
            </div>

            {/* Pending Suggestions (only visible to owner) */}
            {isOwner && pendingSuggestions.length > 0 && (
                <div className="suggestions-section">
                    <h2>Pending Suggestions ({pendingSuggestions.length})</h2>
                    <div className="suggestions-grid">
                        {pendingSuggestions.map(suggestion => (
                            <div key={suggestion._id} className="suggestion-card">
                                <div className="suggestion-book">
                                    {suggestion.book.coverUrl ? (
                                        <img src={suggestion.book.coverUrl} alt={suggestion.book.title} />
                                    ) : (
                                        <div className="no-cover">📕</div>
                                    )}
                                    <div className="suggestion-info">
                                        <h4>{suggestion.book.title}</h4>
                                        <p>{suggestion.book.author}</p>
                                        <p className="suggested-by">
                                            Suggested by {suggestion.userId.profile?.displayName || suggestion.userId.username}
                                        </p>
                                        {suggestion.note && (
                                            <p className="suggestion-note">"{suggestion.note}"</p>
                                        )}
                                    </div>
                                </div>
                                <div className="suggestion-actions">
                                    <button
                                        onClick={() => handleSuggestion(suggestion._id, 'accept')}
                                        className="btn-accept"
                                    >
                                        ✓ Accept
                                    </button>
                                    <button
                                        onClick={() => handleSuggestion(suggestion._id, 'reject')}
                                        className="btn-reject"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Books in List */}
            <div className="books-section">
                <h2>Books ({list.books?.length || 0})</h2>
                {list.books?.length === 0 ? (
                    <div className="empty-books">
                        <p>No books in this list yet.</p>
                        {isOwner && (
                            <button onClick={() => setShowAddBookModal(true)} className="btn-primary">
                                Add Your First Book
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="books-grid">
                        {list.books.map(book => (
                            <div key={book.key} className="book-card">
                                <Link to={`/book${book.key}`} className="book-cover">
                                    {book.coverUrl ? (
                                        <img src={book.coverUrl} alt={book.title} />
                                    ) : (
                                        <div className="no-cover">📕</div>
                                    )}
                                </Link>
                                <div className="book-info">
                                    <Link to={`/book${book.key}`}>
                                        <h4>{book.title}</h4>
                                    </Link>
                                    <p>{book.author}</p>
                                    {isOwner && (
                                        <button
                                            onClick={() => removeBook(book.key)}
                                            className="btn-remove"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Book Modal */}
            {showAddBookModal && (
                <div className="modal-overlay" onClick={() => setShowAddBookModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Add Book to List</h2>

                        <form onSubmit={searchBooks}>
                            <div className="search-box">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search for books..."
                                />
                                <button type="submit" disabled={searching}>
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>

                        <div className="search-results">
                            {searchResults.map(book => (
                                <div key={book.key} className="search-result">
                                    {book.cover_i && (
                                        <img
                                            src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                                            alt={book.title}
                                        />
                                    )}
                                    <div className="result-info">
                                        <h4>{book.title}</h4>
                                        <p>{book.author_name?.[0] || 'Unknown'}</p>
                                    </div>
                                    <button onClick={() => addBookToList(book)} className="btn-add">
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setShowAddBookModal(false)} className="btn-close">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Suggest Book Modal */}
            {showSuggestModal && (
                <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Suggest a Book</h2>

                        <form onSubmit={searchBooks}>
                            <div className="search-box">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search for books..."
                                />
                                <button type="submit" disabled={searching}>
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>

                        <div className="form-group">
                            <label>Add a note (optional)</label>
                            <textarea
                                value={suggestionNote}
                                onChange={e => setSuggestionNote(e.target.value)}
                                placeholder="Why do you think they'd like this book?"
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        <div className="search-results">
                            {searchResults.map(book => (
                                <div key={book.key} className="search-result">
                                    {book.cover_i && (
                                        <img
                                            src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                                            alt={book.title}
                                        />
                                    )}
                                    <div className="result-info">
                                        <h4>{book.title}</h4>
                                        <p>{book.author_name?.[0] || 'Unknown'}</p>
                                    </div>
                                    <button onClick={() => suggestBook(book)} className="btn-suggest">
                                        Suggest
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setShowSuggestModal(false)} className="btn-close">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ListDetail;