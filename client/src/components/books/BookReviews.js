import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SpoilerReview from './SpoilerReview';
import StarRating from './StarRating';
import './BookReviews.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function BookReviews({ bookKey, bookTitle }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('recent');

    useEffect(() => {
        fetchReviews();
    }, [bookKey]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/books/reviews/${encodeURIComponent(bookKey)}`);
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (reviewOwnerId, reviewId) => {
        try {
            const response = await axios.post(
                `${API_URL}/books/reviews/${encodeURIComponent(bookKey)}/like`,
                { reviewOwnerId }
            );

            setReviews(prevReviews => {
                return prevReviews.map(review => {
                    if (review._id === reviewId) {
                        return {
                            ...review,
                            isLikedByCurrentUser: response.data.liked,
                            likesCount: response.data.likesCount
                        };
                    }
                    return review;
                });
            });
        } catch (error) {
            console.error('Error liking review:', error);
            if (error.response?.status === 401) {
                alert('Please log in to like reviews');
            } else {
                alert('Error liking review');
            }
        }
    };


    const sortReviews = (reviewsList) => {
        const sorted = [...reviewsList];

        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.reviewedAt || 0);
                    const dateB = new Date(b.reviewedAt || 0);
                    return dateB - dateA;
                });
            case 'highest-rated':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'lowest-rated':
                return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            case 'most-liked':
                return sorted.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
            default:
                return sorted;
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown date';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const sortedReviews = sortReviews(reviews);

    if (loading) {
        return (
            <div className="book-reviews-section">
                <h3>⏾ Reader Reviews</h3>
                <div className="loading">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="book-reviews-section">
            <div className="reviews-header">
                <h3>⏾ Reader Reviews ({reviews.length})</h3>
                {reviews.length > 0 && (
                    <div className="reviews-controls">
                        <label>Sort by:</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="recent">Most Recent</option>
                            <option value="highest-rated">Highest Rated</option>
                            <option value="lowest-rated">Lowest Rated</option>
                            <option value="most-liked">Most Liked</option>
                        </select>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <div className="no-reviews">
                    <p>No reviews yet. Be the first to review this book!</p>
                </div>
            ) : (
                <div className="reviews-list">
                    {sortedReviews.map((review) => (
                        <div key={review._id} className="review-card">
                            <div className="review-header">
                                <div className="review-user-info">
                                    {review.user.avatarUrl ? (
                                        <img
                                            src={review.user.avatarUrl}
                                            alt={review.user.username}
                                            className="review-avatar"
                                        />
                                    ) : (
                                        <div className="review-avatar-placeholder">
                                            {review.user.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <Link to={`/profile/${review.user.username}`} className="review-username">
                                            {review.user.displayName || review.user.username}
                                        </Link>
                                        <p className="review-date">{formatDate(review.reviewedAt)}</p>
                                    </div>
                                </div>
                                {review.rating > 0 && (
                                    <div className="review-rating">
                                        <StarRating rating={review.rating} readonly size={18} />
                                    </div>
                                )}
                            </div>

                            <div className="review-content">
                                {review.containsSpoilers ? (
                                    <SpoilerReview
                                        review={review.review}
                                        bookTitle={bookTitle}
                                    />
                                ) : (
                                    <p className="review-text">{review.review}</p>
                                )}
                            </div>

                            <div className="review-actions">
                                <button
                                    onClick={() => toggleLike(review.reviewOwnerId, review._id)}
                                    className={`like-button ${review.isLikedByCurrentUser ? 'liked' : ''}`}
                                >
                                    <span className="like-icon">
                                        {review.isLikedByCurrentUser ? '❤️' : '🤍'}
                                    </span>
                                    <span className="like-count">
                                        {review.likesCount || 0}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default BookReviews;