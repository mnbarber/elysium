import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './BookDetails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BookDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    
    if (bookKey) {
      fetchBookDetails();
    }
  }, [bookKey]);

    const addToLibrary = async (libraryName) => {
        try {
            const bookData = {
                key: book.key,
                title: book.title,
                author: book.author,
                coverUrl: book.coverId ? `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg` : '',
                firstPublishYear: book.firstPublishDate,
                rating: 0,
                review: '',
                readCount: 0
            };

            if (libraryName === 'read') {
                bookData.completedAt = new Date();
            }

            await axios.post(`${API_URL}/libraries/${libraryName}`, bookData);
            alert('Book added to library!');
        } catch (err) {
            alert('Failed to add book to library');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!book) return <div>No book details available</div>;

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
                        <img src='https://i.imgur.com/GxzWr9n.jpeg' />
                    )}
                </div>

                <div className="book-main-info">
                    <h1>{book.title}</h1>
                    {book.subtitle && <h2 className="subtitle">{book.subtitle}</h2>}

                    <div className="authors-list">
                        <h3>by {book.author}</h3>
                    </div>

                    <div className="book-meta">
                        {book.firstPublishDate && (
                            <div className="meta-item">
                                <span className="meta-label">First Published:</span>
                                <span className="meta-value">{book.firstPublishDate}</span>
                            </div>
                        )}
                        {book.numberOfPages && (
                            <div className="meta-item">
                                <span className="meta-label">Pages:</span>
                                <span className="meta-value">{book.numberOfPages}</span>
                            </div>
                        )}
                        {book.publisher && (
                            <div className="meta-item">
                                <span className="meta-label">Publisher:</span>
                                <span className="meta-value">{book.publisher}</span>
                            </div>
                        )}
                        {book.physicalFormat && (
                            <div className="meta-item">
                                <span className="meta-label">Format:</span>
                                <span className="meta-value">{book.physicalFormat}</span>
                            </div>
                        )}
                        {book.isbn13 && (
                            <div className="meta-item">
                                <span className="meta-label">ISBN-13:</span>
                                <span className="meta-value">{book.isbn13}</span>
                            </div>
                        )}
                    </div>

                    <div className="book-actions">
                        <button onClick={() => addToLibrary('to-read')} className="btn-add">
                            Add to To Read
                        </button>
                        <button onClick={() => addToLibrary('currently-reading')} className="btn-add">
                            Add to Currently Reading
                        </button>
                        <button onClick={() => addToLibrary('read')} className="btn-add">
                            Add to Read
                        </button>
                    </div>
                </div>
            </div>

            {book.description && (
                <div className="book-description">
                    <h3>Description</h3>
                    <p>{book.description}</p>
                </div>
            )}

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

            {book.author.bio && (
                <div className="author-bios">
                    <h3>About the Author, {book.author}</h3>
                    <div className="author-bio">
                        <h4>{book.author.name}</h4>
                        <p>{typeof book.author.bio === 'string' ? book.author.bio : book.author.bio.value}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BookDetails;