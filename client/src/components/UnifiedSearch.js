import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UnifiedSearch.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function UnifiedSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ books: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults({ books: [], users: [] });
            setShowResults(false);
            return;
        }

        const delayDebounce = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const performSearch = async () => {
        try {
            setLoading(true);
            const [booksResponse, usersResponse] = await Promise.all([
                axios.get(`${API_URL}/books/search`, {
                    params: { q: query, limit: 5 }
                }),
                axios.get(`${API_URL}/search`, {
                    params: { q: query }
                })
            ]);

            const books = booksResponse.data.docs.slice(0, 5).map(book => ({
                key: book.key,
                title: book.title,
                author: book.author_name?.[0] || 'Unknown Author',
                coverUrl: book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
                    : null
            }));

            const users = usersResponse.data.users || [];

            setResults({ books, users });
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookClick = (book) => {
        navigate(`/book${book.key}`);
        setQuery('');
        setShowResults(false);
    };

    const handleUserClick = (user) => {
        navigate(`/profile/${user.username}`);
        setQuery('');
        setShowResults(false);
    };

    const handleViewAllBooks = () => {
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setQuery('');
        setShowResults(false);
    };

    return (
        <div className="unified-search" ref={searchRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search books or users..."
                    className="unified-search-input"
                />
                {loading && <span className="search-loading">⏳</span>}
            </div>

            {showResults && (results.books.length > 0 || results.users.length > 0) && (
                <div className="search-results-dropdown">
                    {results.users.length > 0 && (
                        <div className="search-section">
                            <h4 className="search-section-title">Users</h4>
                            {results.users.map(user => (
                                <div
                                    key={user._id}
                                    className="search-result-item user-item"
                                    onClick={() => handleUserClick(user)}
                                >
                                    {user.profile?.avatarUrl ? (
                                        <img
                                            src={user.profile.avatarUrl}
                                            alt={user.username}
                                            className="user-avatar-small"
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder-small">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="user-info">
                                        <span className="user-display-name">
                                            {user.profile?.displayName || user.username}
                                        </span>
                                        <span className="user-username">@{user.username}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.books.length > 0 && (
                        <div className="search-section">
                            <h4 className="search-section-title">Books</h4>
                            {results.books.map(book => (
                                <div
                                    key={book.key}
                                    className="search-result-item book-item"
                                    onClick={() => handleBookClick(book)}
                                >
                                    {book.coverUrl ? (
                                        <img
                                            src={book.coverUrl}
                                            alt={book.title}
                                            className="book-cover-tiny"
                                        />
                                    ) : (
                                        <div className="book-cover-placeholder-tiny">📕</div>
                                    )}
                                    <div className="book-info">
                                        <span className="book-title-small">{book.title}</span>
                                        <span className="book-author-small">{book.author}</span>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleViewAllBooks}
                                className="view-all-btn"
                            >
                                View all book results →
                            </button>
                        </div>
                    )}

                    {results.books.length === 0 && results.users.length === 0 && (
                        <div className="no-search-results">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UnifiedSearch;