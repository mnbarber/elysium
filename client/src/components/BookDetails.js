import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './BookDetails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BookDetails() {
    const params = useParams();
    const bookKey = params['*'];
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    console.log('Book key from params:', bookKey);

    useEffect(() => {
        fetchBookDetails();
    }, [bookKey]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            const fullURL = `${API_URL}/books/details/${bookKey}`;
            console.log('API_URL:', API_URL);
            console.log('bookKey:', bookKey);
            console.log('Full URL being called:', fullURL);

            const response = await axios.get(fullURL);
            setBook(response.data);
        } catch (err) {
            setError('Failed to fetch book details');
        } finally {
            setLoading(false);
        }
    };

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
                        {book.authors.map((author, index) => (
                            <div key={index} className="author-info">
                                <h3>by {author.name}</h3>
                                {author.birthDate && <p className="author-birth">Born: {author.birthDate}</p>}
                            </div>
                        ))}
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

            {book.authors.some(a => a.bio) && (
                <div className="author-bios">
                    <h3>About the Author{book.authors.length > 1 ? 's' : ''}</h3>
                    {book.authors.map((author, index) => (
                        author.bio && (
                            <div key={index} className="author-bio">
                                <h4>{author.name}</h4>
                                <p>{typeof author.bio === 'string' ? author.bio : author.bio.value}</p>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

export default BookDetails;