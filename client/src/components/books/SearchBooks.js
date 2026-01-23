import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './SearchBooks.css';
import StarRating from './StarRating';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function SearchBooks() {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
            setSearchQuery(urlQuery);
            searchBooks(urlQuery);
        }
    }, [searchParams]);

    const searchBooks = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/books/search`, {
                params: { q: searchQuery }
            });
            setSearchResults(response.data.docs || []);
        } catch (error) {
            console.error('Error searching books:', error);
            alert('Error searching books');
        } finally {
            setLoading(false);
        }
    };

    const addBookToLibrary = async (book, libraryName) => {
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

            await axios.post(`${API_URL}/libraries/${libraryName}`, bookData);
            alert(`Added "${book.title}" to ${libraryName.replace('-', ' ')}!`);
        } catch (error) {
            console.error('Error adding book:', error);
            alert(error.response?.data?.error || 'Error adding book to library');
        }
    };

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

    return (
        <div className="search-books-container">
            <div className="search-header">
                <h1>Search Books</h1>
                <p className="subtitle">Discover your next great read!</p>
            </div>

            <form onSubmit={searchBooks} className="search-form">
                <input
                    type="text"
                    placeholder="Search for books by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="cant-find-book">
                <Link to="/add-book" className="add-book-link">
                    Can't find your book? Add it yourself here →
                </Link>
            </div>

            {loading && <div className="loading">Searching...</div>}

            {searchResults.length > 0 && (
                <div className="search-book-results">
                    <h2>Results ({searchResults.length})</h2>
                    <div className="results-grid">
                        {searchResults.map((book) => (
                            <div key={book.key} className="book-result-card">
                                <Link to={`/book${book.key}`} className="book-cover">
                                    {book.cover_i ? (
                                        <img
                                            src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                                            alt={book.title}
                                        />
                                    ) : (
                                        <div className="no-cover">🕮</div>
                                    )}
                                </Link>
                                <div className="book-info">
                                    <Link to={`/book${book.key}`}>
                                        <h3>{book.title}</h3>
                                    </Link>
                                    <p className="author">{book.author_name?.[0] || 'Unknown Author'}</p>
                                    {book.first_publish_year && (
                                        <p className="year">{book.first_publish_year}</p>
                                    )}
                                    <div className="rating-section">
                                        <p className="rating-label">Rate this book:</p>
                                        <StarRating
                                            rating={0}
                                            onRate={(rating) => rateBook(book, rating)}
                                            size="medium"
                                        />
                                    </div>
                                    <div className="search-add-buttons">
                                        <button onClick={() => addBookToLibrary(book, 'to-read')} className='search-add-button'>
                                            To Read
                                        </button>
                                        <button onClick={() => addBookToLibrary(book, 'currently-reading')} className='search-add-button'>
                                            Currently Reading
                                        </button>
                                        <button onClick={() => addBookToLibrary(book, 'read')} className='search-add-button'>
                                            Read
                                        </button>
                                        <button onClick={() => addBookToLibrary(book, 'paused')} className='search-add-button'>
                                            Paused
                                        </button>
                                        <button onClick={() => addBookToLibrary(book, 'dnf')} className='search-add-button'>
                                            DNF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && searchQuery && searchResults.length === 0 && (
                <div className="no-results">
                    <p>No books found for "{searchQuery}"</p>
                    <p>Try a different search or <Link to="/add-book">add the book manually</Link></p>
                </div>
            )}
        </div>
    );
}

export default SearchBooks;