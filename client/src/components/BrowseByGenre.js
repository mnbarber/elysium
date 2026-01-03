import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import CompletionDateModal from './CompletionDateModal';
import './BrowseByGenre.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BrowseByGenre() {
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingLibrary, setPendingLibrary] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  const genres = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science_fiction', label: 'Science Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'romance', label: 'Romance' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'horror', label: 'Horror' },
    { value: 'historical_fiction', label: 'Historical Fiction' },
    { value: 'biography', label: 'Biography' },
    { value: 'self_help', label: 'Self Help' },
    { value: 'business', label: 'Business' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'young_adult', label: 'Young Adult' },
    { value: 'classics', label: 'Classics' },
    { value: 'cookbooks', label: 'Cookbooks' },
    { value: 'art', label: 'Art' }
  ];

  useEffect(() => {
    fetchBooksByGenre(selectedGenre);
  }, [selectedGenre]);

  const fetchBooksByGenre = async (genre) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/books/browse/${genre}`);
      setBooks(response.data.works || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (book, libraryName) => {
    // If adding to 'read' library, open date modal
    if (libraryName === 'read') {
      openDateModal(book, libraryName);
      return;
    }

    try {
      const bookData = {
        key: book.key,
        title: book.title,
        author: book.authors?.[0]?.name || 'Unknown',
        coverUrl: book.cover_id 
          ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
          : null,
        firstPublishYear: book.first_publish_year,
        rating: 0
      };

      await axios.post(`${API_URL}/libraries/${libraryName}`, bookData);
      alert('Book added successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding book');
    }
  };

  const rateBook = async (book, rating) => {
    try {
      const bookData = {
        key: book.key,
        title: book.title,
        author: book.authors?.[0]?.name || 'Unknown',
        coverUrl: book.cover_id 
          ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
          : null,
        firstPublishYear: book.first_publish_year
      };

      await axios.post(`${API_URL}/books/rate`, {
        book: bookData,
        rating: rating
      });
      alert('Book rated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error rating book');
    }
  };

  const openReviewModal = (book) => {
    const bookData = {
      key: book.key,
      title: book.title,
      author: book.authors?.[0]?.name || 'Unknown',
      coverUrl: book.cover_id 
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : null,
      firstPublishYear: book.first_publish_year
    };
    setSelectedBook(bookData);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBook(null);
  };

  const submitReview = async (review) => {
    try {
      await axios.post(`${API_URL}/books/review`, {
        book: selectedBook,
        review: review
      });
      closeReviewModal();
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error submitting review');
    }
  };

  const openDateModal = (book, libraryName) => {
  const bookData = {
    key: book.key,
    title: book.title,
    author: book.authors?.[0]?.name || 'Unknown',
    coverUrl: book.cover_id 
      ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
      : null,
    firstPublishYear: book.first_publish_year
  };
  setSelectedBook(bookData);
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
      ...selectedBook,
      rating: 0,
      review: '',
      readCount: 0,
      completedAt: completionDate
    };

    await axios.post(`${API_URL}/libraries/${pendingLibrary}`, bookData);
    closeDateModal();
    alert('Book added successfully!');
  } catch (error) {
    alert(error.response?.data?.error || 'Error adding book');
  }
};

  return (
    <div className="browse-container">
      <h1>Browse Books by Genre</h1>

      <div className="genre-selector">
        <label>Select Genre:</label>
        <select 
          value={selectedGenre} 
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genres.map(genre => (
            <option key={genre.value} value={genre.value}>
              {genre.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-text">Loading books...</p>}

      <div className="browse-results">
        {books.map((book) => (
          <div key={book.key} className="browse-book-card">
            {book.cover_id && (
              <img
                src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                alt={book.title}
              />
            )}
            <div className="book-info">
              <Link to={`/book/${book.key}`} className="book-title-link">
                <h3>{book.title}</h3>
              </Link>
              <p>by {book.authors?.[0]?.name || 'Unknown'}</p>
              <p className="year">{book.first_publish_year}</p>

              <div className="rating-section">
                <p className="rating-label">Rate this book:</p>
                <StarRating
                  rating={0}
                  onRate={(rating) => rateBook(book, rating)}
                  size="large"
                />
              </div>

              <div className="button-group">
                <button 
                  className="btn-review"
                  onClick={() => openReviewModal(book)}
                >
                  Write Review
                </button>
                <button onClick={() => addToLibrary(book, 'to-read')}>
                  To Read
                </button>
                <button onClick={() => addToLibrary(book, 'currently-reading')}>
                  Currently Reading
                </button>
                <button onClick={() => addToLibrary(book, 'read')}>
                  Read
                </button>
                <button onClick={() => addToLibrary(book, 'paused')}>
                  Paused
                </button>
                <button onClick={() => addToLibrary(book, 'dnf')}>
                  DNF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showReviewModal && (
        <ReviewModal
          book={selectedBook}
          existingReview=""
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
    </div>
  );
}

export default BrowseByGenre;