import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './BrowseLists.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BrowseLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPublicLists();
    }, []);

    const fetchPublicLists = async (search = '') => {
        try {
            setLoading(true);
            const url = search
                ? `${API_URL}/lists/public?search=${encodeURIComponent(search)}`
                : `${API_URL}/lists/public`;
            const response = await axios.get(url);
            setLists(response.data.lists);
        } catch (err) {
            console.error('Error fetching public lists:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPublicLists(searchQuery);
    };

    if (loading) {
        return <div className="loading">Loading public lists...</div>;
    }

    return (
        <div className="browse-lists-container">
            <div className="browse-header">
                <h1>Browse Public Lists</h1>
                <p className="subtitle">Discover curated book collections from other readers</p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search lists by title or description..."
                />
                <button type="submit">Search</button>
            </form>

            {lists.length === 0 ? (
                <div className="empty-state">
                    <p>No public lists found.</p>
                </div>
            ) : (
                <div className="lists-grid">
                    {lists.map(list => (
                        <Link key={list._id} to={`/lists/${list._id}`} className="list-card">
                            <div className="list-card-header">
                                <h3>{list.title}</h3>
                            </div>

                            {list.description && (
                                <p className="list-description">{list.description}</p>
                            )}

                            <div className="list-creator">
                                <span>by {list.userId.profile?.displayName || list.userId.username}</span>
                            </div>

                            <div className="list-stats">
                                <span>{list.books?.length || 0} books</span>
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default BrowseLists;