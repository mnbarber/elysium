import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Libraries.css';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import CompletionDateModal from './CompletionDateModal';
import PageProgressModal from './PageProgressModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Libraries() {
    const [libraries, setLibraries] = useState({
        'to-read': [],
        'currently-reading': [],
        'read': [],
        'paused': [],
        'dnf': []
    });
    const [activeLibrary, setActiveLibrary] = useState('to-read');
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [existingReview, setExistingReview] = useState('');
    const [pendingLibrary, setPendingLibrary] = useState('');
    const [showEditDateModal, setShowEditDateModal] = useState(false);
    const [showMoveDropdown, setShowMoveDropdown] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedBookForProgress, setSelectedBookForProgress] = useState(null);
    const [sortBy, setSortBy] = useState('latest');

    useEffect(() => {
        fetchLibraries();
    }, []);

    const fetchLibraries = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/libraries`);
            setLibraries(response.data);
        } catch (error) {
            console.error('Error fetching libraries:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortBooks = (books) => {
        const booksCopy = [...books];

        switch (sortBy) {
            case 'latest':
                return booksCopy.sort((a, b) => {
                    const dateA = new Date(a.addedAt || a.createdAt || 0);
                    const dateB = new Date(b.addedAt || b.createdAt || 0);
                    return dateB - dateA; // Newest first
                });

            case 'oldest':
                return booksCopy.sort((a, b) => {
                    const dateA = new Date(a.addedAt || a.createdAt || 0);
                    const dateB = new Date(b.addedAt || b.createdAt || 0);
                    return dateA - dateB; // Oldest first
                });

            case 'title-asc':
                return booksCopy.sort((a, b) =>
                    (a.title || '').localeCompare(b.title || '')
                );

            case 'title-desc':
                return booksCopy.sort((a, b) =>
                    (b.title || '').localeCompare(a.title || '')
                );

            case 'author-asc':
                return booksCopy.sort((a, b) =>
                    (a.author || '').localeCompare(b.author || '')
                );

            case 'rating':
                return booksCopy.sort((a, b) =>
                    (b.rating || 0) - (a.rating || 0)
                );

            default:
                return booksCopy;
        }
    };

    const removeBook = async (bookKey, libraryName) => {
        if (!window.confirm('Remove this book from your library?')) return;

        try {
            await axios.delete(`${API_URL}/libraries/${libraryName}/${encodeURIComponent(bookKey)}`);
            fetchLibraries();
        } catch (error) {
            console.error('Error removing book:', error);
            alert('Error removing book');
        }
    };

    const libraryLabels = {
        'to-read': 'To Read',
        'currently-reading': 'Currently Reading',
        'read': 'Read',
        'paused': 'Paused',
        'dnf': 'Did Not Finish'
    };

    const currentBooks = sortBooks(libraries[activeLibrary] || []);

    const updateRating = async (bookKey, rating) => {
        try {
            await axios.put(`${API_URL}/books/rate/${encodeURIComponent(bookKey)}`, {
                rating: rating
            });
            await fetchLibraries();
        } catch (error) {
            console.error('Error updating rating:', error);
        }
    };

    const moveBook = async (book, fromLibrary, toLibrary) => {
        if (fromLibrary === toLibrary) {
            return;
        }

        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                firstPublishYear: book.firstPublishYear,
                rating: book.rating || 0,
                review: book.review || '',
                readCount: book.readCount || 0,
                completedAt: book.completedAt || null
            };

            console.log('Moving book:', bookData, 'from', fromLibrary, 'to', toLibrary);

            await axios.post(`${API_URL}/libraries/move`, {
                book: bookData,
                fromLibrary: fromLibrary,
                toLibrary: toLibrary
            });

            console.log('Move successful, fetching libraries...');
            setShowMoveDropdown(null);
            await fetchLibraries();
            alert(`Moved "${book.title}" to ${libraryLabels[toLibrary]}`);
        } catch (error) {
            console.error('Error moving book:', error);
            alert('Error moving book');
        }
    };

    const toggleMoveDropdown = (bookKey) => {
        setShowMoveDropdown(showMoveDropdown === bookKey ? null : bookKey);
    };

    const openReviewModal = (book, review = '', containsSpoilers = false) => {
        setSelectedBook(book);
        setExistingReview(review);
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setSelectedBook(null);
        setExistingReview('');
    };

    const submitReview = async (review, containsSpoilers) => {
        try {
            const bookData = {
                key: selectedBook.key,
                title: selectedBook.title,
                author: selectedBook.author_name?.[0] || 'Unknown',
                coverUrl: selectedBook.coverUrl
            };

            const response = await axios.post(`${API_URL}/books/review`, {
                book: bookData,
                review: review,
                containsSpoilers: containsSpoilers
            });

            setLibraries(response.data.libraries);
            closeReviewModal();
            alert(response.data.message);
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const deleteReview = async () => {
        try {
            await axios.delete(`${API_URL}/books/review/${encodeURIComponent(selectedBook.key)}`);

            await fetchLibraries();
            closeReviewModal();
            alert('Review deleted successfully!');
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Error deleting review');
        }
    };

    const openDateModal = (book, libraryName) => {
        setSelectedBook(book);
        setPendingLibrary(libraryName);
        setShowDateModal(true);
    };

    const closeDateModal = () => {
        setShowDateModal(false);
        setSelectedBook(null);
        setPendingLibrary('');
    };

    const submitWithDate = async (completionDate) => {
        try {
            const bookData = {
                key: selectedBook.key,
                title: selectedBook.title,
                author: selectedBook.author,
                coverUrl: selectedBook.coverUrl,
                firstPublishYear: selectedBook.firstPublishYear,
                rating: 0,
                review: '',
                readCount: 0,
                completedAt: completionDate
            };

            await axios.post(`${API_URL}/libraries/${pendingLibrary}`, bookData);
            await fetchLibraries();
            closeDateModal();
            alert('Book added successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Error adding book');
        }
    };

    const editCompletionDate = async (book) => {
        setSelectedBook(book);
        setShowEditDateModal(true);
    };

    const updateCompletionDate = async (completionDate) => {
        try {
            await axios.put(`${API_URL}/books/completion-date/${encodeURIComponent(selectedBook.key)}`, {
                completedAt: completionDate
            });
            await fetchLibraries();
            setShowEditDateModal(false);
            setSelectedBook(null);
            alert('Completion date updated!');
        } catch (error) {
            alert('Error updating completion date');
        }
    };

    const handleRemoveCompletionDate = async (book) => {
        if (!window.confirm('Remove the completion date for this book?')) return;

        try {
            await axios.put(
                `${API_URL}/books/completion-date/${encodeURIComponent(book.key)}`,
                { completedAt: null }
            );

            await fetchLibraries();
            alert('Completion date removed');
        } catch (err) {
            console.error('Error removing completion date:', err);
            alert('Error removing completion date');
        }
    };

    const openProgressModal = (book) => {
        setSelectedBookForProgress(book);
        setShowProgressModal(true);
    };

    const closeProgressModal = () => {
        setShowProgressModal(false);
        setSelectedBookForProgress(null);
    };

    const updateProgress = async (currentPage) => {
        try {
            await axios.put(`${API_URL}/books/progress/${encodeURIComponent(selectedBookForProgress.key)}`, {
                currentPage
            });

            await fetchLibraries();
            closeProgressModal();
            alert('Progress updated!');
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Error updating progress');
        }
    };

    if (loading) {
        return <div className="loading">Loading your libraries...</div>;
    }

    return (
        <div className="libraries-container">
            <div className="libraries-header">
                <h1>My Libraries</h1>
                <Link to="/stats" className="btn-stats">
                    View Reading Stats
                </Link>
            </div>

            <div className="library-tabs">
                {Object.entries(libraryLabels).map(([key, label]) => (
                    <button
                        key={key}
                        className={`library-tab ${activeLibrary === key ? 'active' : ''}`}
                        onClick={() => setActiveLibrary(key)}
                    >
                        {label}
                        <span className="count">({libraries[key]?.length || 0})</span>
                    </button>
                ))}
            </div>

            <div className="library-controls">
                <div className="sort-controls">
                    <label htmlFor="sort-select">Sort by:</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-dropdown"
                    >
                        <option value="latest">Latest Added</option>
                        <option value="oldest">Oldest Added</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="author-asc">Author (A-Z)</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>
                <div className="book-count">
                    {currentBooks.length} {currentBooks.length === 1 ? 'book' : 'books'}
                </div>
            </div>

            <div className="library-content">
                {currentBooks.length === 0 ? (
                    <div className="empty-library">
                        <p>No books in "{libraryLabels[activeLibrary]}" yet.</p>
                        <Link to="/search" className="btn-search">
                            Search for Books
                        </Link>
                    </div>
                ) : (
                    <div className="books-grid">
                        {currentBooks.map((book) => (
                            <div key={book.key} className="book-card">
                                <Link to={`/book${book.key}`} className="book-cover">
                                    {book.coverUrl ? (
                                        <img src={book.coverUrl} alt={book.title} />
                                    ) : (
                                        <img src='https://i.imgur.com/GxzWr9n.jpeg' alt={book.title} />
                                    )}
                                </Link>
                                <div className="book-info">
                                    <Link to={`/book${book.key}`}>
                                        <h3>{book.title}</h3>
                                    </Link>
                                    {book.readCount > 1 && (
                                        <span className="reread-badge">
                                            Re-read ({book.readCount}x)
                                        </span>
                                    )}
                                    <p className="author">{book.author || 'Unknown Author'}</p>

                                    <div className="rating-section">
                                        <p className="rating-label">Rate this book:</p>
                                        <StarRating
                                            rating={book.rating || 0}
                                            onRate={(rating) => updateRating(book.key, rating)}
                                            size="medium"
                                        />
                                    </div>

                                    {activeLibrary === 'currently-reading' && (
                                        <div className="book-progress-section">
                                            {book.numberOfPages && book.numberOfPages > 0 ? (
                                                <>
                                                    <div className="progress-bar-small">
                                                        <div
                                                            className="progress-fill-small"
                                                            style={{
                                                                width: `${Math.min((book.currentPage || 0) / book.numberOfPages * 100, 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="progress-text-small">
                                                        {book.currentPage || 0} / {book.numberOfPages} pages
                                                        ({Math.round((book.currentPage || 0) / book.numberOfPages * 100)}%)
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="progress-text-small">No page count available</p>
                                            )}
                                            <button
                                                className="btn-update-progress"
                                                onClick={() => openProgressModal(book)}
                                            >
                                                Update Progress
                                            </button>
                                        </div>
                                    )}

                                    {activeLibrary === 'read' && (
                                        <div className="completion-date-display">
                                            {book.completedAt ? (
                                                <>
                                                    <p className="completion-date-text">
                                                        Finished: {new Date(book.completedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <div className="date-action-buttons">
                                                        <button
                                                            onClick={() => editCompletionDate(book)}
                                                            className="btn-edit-small"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveCompletionDate(book)}
                                                            className="btn-remove-small"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => editCompletionDate(book)}
                                                    className="btn-add-date"
                                                >
                                                    + Add Completion Date
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="move-dropdown-container">
                                        <button
                                            className="btn-move"
                                            onClick={() => toggleMoveDropdown(book.key)}
                                        >
                                            Move to... ▾
                                        </button>
                                        {showMoveDropdown === book.key && (
                                            <div className="move-dropdown">
                                                {Object.entries(libraryLabels).map(([key, label]) => (
                                                    key !== activeLibrary && (
                                                        <button
                                                            key={key}
                                                            className="move-option"
                                                            onClick={() => moveBook(book, activeLibrary, key)}
                                                        >
                                                            {label}
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn-review"
                                        onClick={() => openReviewModal({
                                            key: book.key,
                                            title: book.title,
                                            author: book.author || 'Unknown',
                                            coverUrl: book.coverUrl
                                        },
                                            book.review || '',
                                            book.containsSpoilers || false
                                        )}
                                    >
                                        {book.review ? 'Edit Review' : 'Write Review'}
                                    </button>
                                    <button
                                        onClick={() => removeBook(book.key, activeLibrary)}
                                        className="btn-remove"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showReviewModal && (
                <ReviewModal
                    book={selectedBook}
                    existingReview={existingReview}
                    existingSpoilerFlag={selectedBook?.containsSpoilers || false}
                    onClose={closeReviewModal}
                    onSubmit={submitReview}
                    onDelete={deleteReview}
                />
            )}
            {showDateModal && (
                <CompletionDateModal
                    book={selectedBook}
                    onClose={closeDateModal}
                    onSubmit={submitWithDate}
                />
            )}
            {showEditDateModal && (
                <CompletionDateModal
                    book={selectedBook}
                    onClose={() => setShowEditDateModal(false)}
                    onSubmit={updateCompletionDate}
                    existingDate={selectedBook?.completedAt}
                />
            )}
            {showProgressModal && (
                <PageProgressModal
                    book={selectedBookForProgress}
                    onClose={closeProgressModal}
                    onSubmit={updateProgress}
                />
            )}
        </div>
    );
}

export default Libraries;