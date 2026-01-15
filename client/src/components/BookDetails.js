import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import PageProgressModal from './PageProgressModal';
import EditBookModal from './EditBookModal';
import BookReviews from './BookReviews';
import './BookDetails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BookDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [bookInLibrary, setBookInLibrary] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error] = useState(null);

    const bookKey = location.pathname.replace('/book', '');

    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/books/details`, {
                    params: { key: bookKey }
                });
                setBook(response.data);
            } catch (error) {
                console.error('Error fetching book details:', error);
            } finally {
                setLoading(false);
            }
        };

        const checkIfInLibrary = async () => {
            try {
                const response = await axios.get(`${API_URL}/books/library-status/${encodeURIComponent(bookKey)}`);
                if (response.data.inLibrary) {
                    setBookInLibrary(response.data);
                }
            } catch (error) {
                console.error('Error checking library status:', error);
                setBookInLibrary(null);
            }
        };

        if (bookKey) {
            fetchBookDetails();
            checkIfInLibrary();
        }
    }, [bookKey]);

    const addToLibrary = async (libraryName) => {
        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                firstPublishYear: book.firstPublishYear,
                numberOfPages: book.numberOfPages,
                rating: 0,
                review: '',
                readCount: 0
            };

            if (libraryName === 'read') {
                bookData.completedAt = new Date();
            }

            await axios.post(`${API_URL}/libraries/${libraryName}`, bookData);
            alert('Book added to library!');

            const response = await axios.get(`${API_URL}/books/library-status/${encodeURIComponent(bookKey)}`);
            if (response.data.inLibrary) {
                setBookInLibrary(response.data);
            }
        } catch (err) {
            console.error('Error adding book:', err);
            alert('Failed to add book to library');
        }
    };

    const updateProgress = async (currentPage) => {
        try {
            await axios.put(`${API_URL}/books/progress/${encodeURIComponent(book.key)}`, {
                currentPage
            });

            setBookInLibrary(prev => ({
                ...prev,
                book: {
                    ...prev.book,
                    currentPage
                }
            }));

            setShowProgressModal(false);
            alert('Progress updated!');
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Error updating progress');
        }
    };

    const editBook = async (updates) => {
        try {
            await axios.put(`${API_URL}/books/edit/${encodeURIComponent(book.key)}`, updates);

            setBook(prev => ({ ...prev, ...updates }));
            setBookInLibrary(prev => ({
                ...prev,
                book: { ...prev.book, ...updates }
            }));

            setShowEditModal(false);
            alert('Book details updated!');
        } catch (error) {
            console.error('Error editing book:', error);
            alert('Error editing book');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!book) return <div className="error">No book details available</div>;

    return (
        <div className="book-details-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <div className="book-details-header">
                <div className="book-cover-large">
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} />
                    ) : (
                        <img src='https://i.imgur.com/GxzWr9n.jpeg' alt={book.title} />
                    )}
                </div>

                <div className="book-main-info">
                    <h1>{book.title}</h1>
                    {book.isCustom && (
                        <span className="custom-badge">Custom Book</span>
                    )}
                    {book.subtitle && <h2 className="subtitle">{book.subtitle}</h2>}

                    <div className="authors-list">
                        <h3>by {book.author}</h3>
                    </div>

                    <div className="book-meta">
                        {book.firstPublishYear && (
                            <div className="meta-item">
                                <span className="meta-label">First Published:</span>
                                <span className="meta-value">{book.firstPublishYear}</span>
                            </div>
                        )}
                        {book.numberOfPages && (
                            <div className="meta-item">
                                <span className="meta-label">Pages:</span>
                                <span className="meta-value">{book.numberOfPages}</span>
                            </div>
                        )}
                        {book.isbn && (
                            <div className="meta-item">
                                <span className="meta-label">ISBN:</span>
                                <span className="meta-value">{book.isbn}</span>
                            </div>
                        )}
                    </div>

                    {bookInLibrary && bookInLibrary.library === 'currentlyReading' && (
                        <div className="reading-progress-section">
                            <h3>📖 Reading Progress</h3>
                            {book.numberOfPages && book.numberOfPages > 0 ? (
                                <>
                                    <div className="progress-bar-large">
                                        <div
                                            className="progress-fill-large"
                                            style={{
                                                width: `${Math.min((bookInLibrary.book.currentPage || 0) / book.numberOfPages * 100, 100)}%`
                                            }}
                                        />
                                    </div>
                                    <p className="progress-stats">
                                        {bookInLibrary.book.currentPage || 0} of {book.numberOfPages} pages
                                        ({Math.round((bookInLibrary.book.currentPage || 0) / book.numberOfPages * 100)}%)
                                    </p>
                                    <button
                                        onClick={() => setShowProgressModal(true)}
                                        className="btn-update-progress-large"
                                    >
                                        Update Progress
                                    </button>
                                </>
                            ) : (
                                <p>No page count available for this book.</p>
                            )}
                        </div>
                    )}

                    <div className="book-actions">
                        {!bookInLibrary ? (
                            <>
                                <button onClick={() => addToLibrary('toRead')} className="btn-add">
                                    Add to To Read
                                </button>
                                <button onClick={() => addToLibrary('currentlyReading')} className="btn-add">
                                    Add to Currently Reading
                                </button>
                                <button onClick={() => addToLibrary('read')} className="btn-add">
                                    Add to Read
                                </button>
                            </>
                        ) : (
                                <div>
                                    <p className="in-library-notice">
                                        ✓ In your library ({bookInLibrary.library === 'toRead' ? 'To Read' :
                                            bookInLibrary.library === 'currentlyReading' ? 'Currently Reading' :
                                                bookInLibrary.library === 'read' ? 'Read' :
                                                    bookInLibrary.library === 'paused' ? 'Paused' : 'Did Not Finish'})
                                    </p>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="btn-edit-book"
                                    >
                                        Edit Book Details
                                    </button>
                                </div>
                        )}
                    </div>
                </div>
            </div>

            {book.description && (
                <div className="book-description">
                    <h3>Description</h3>
                    <p>{book.description}</p>
                </div>
            )}

            <BookReviews bookKey={book.key} bookTitle={book.title} />

            {book.subjects && book.subjects.length > 0 && (
                <div className="book-subjects">
                    <h3>Subjects & Genres</h3>
                    <div className="subjects-list">
                        {book.subjects.map((subject, index) => (
                            <span key={index} className="subject-tag">{subject}</span>
                        ))}
                    </div>
                </div>
            )}

            {showProgressModal && bookInLibrary && (
                <PageProgressModal
                    book={{ ...book, currentPage: bookInLibrary.book.currentPage || 0 }}
                    onClose={() => setShowProgressModal(false)}
                    onSubmit={updateProgress}
                />
            )}
            {showEditModal && bookInLibrary && (
                <EditBookModal
                    book={bookInLibrary.book}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={editBook}
                />
            )}
        </div>
    );
}

export default BookDetails;