import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Libraries.css';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import CompletionDateModal from './CompletionDateModal';

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
    const [showMoveDropdown, setShowMoveDropdown] = useState(null); // Track which book's dropdown is open

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

    const currentBooks = libraries[activeLibrary] || [];

    const rateBook = async (book, rating) => {
        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author_name?.[0] || 'Unknown',
                coverUrl: book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : null,
                firstPublishYear: book.first_publish_year
            };

            await axios.post(`${API_URL}/books/rate`, {
                book: bookData,
                rating
            });
            alert('Book rated and added to your library!');
        } catch (error) {
            console.error('Error rating book:', error);
        }
    };

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
            return; // Don't move to same library
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
            setShowMoveDropdown(null); // Close dropdown after move
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

    const deleteReview = async (bookKey) => {
        try {
            await axios.delete(`${API_URL}/books/review/${encodeURIComponent(bookKey)}`);
            await fetchLibraries();
            alert('Review deleted successfully!');
        } catch (error) {
            console.error('Error deleting review:', error);
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
        </div>
    );
}

export default Libraries;