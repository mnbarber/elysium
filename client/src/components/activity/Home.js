import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import PageProgressModal from '../books/PageProgressModal';
import Goals from '../profile/Goals';
import SpoilerReview from '../books/SpoilerReview';
import ActivityText from './ActivityText';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Home() {
    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState('');
    const [currentlyReading, setCurrentlyReading] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const activitiesPerPage = 20;

    useEffect(() => {
        if (!authLoading && user) {
            fetchHomeData();
        } else if (!authLoading && !user) {
            setLoading(false);
            setError('Please log in to view your home page');
        }
    }, [authLoading, user]);

    const fetchHomeData = async () => {
        try {
            setLoading(true);

            const librariesResponse = await axios.get(`${API_URL}/libraries`);
            setCurrentlyReading(librariesResponse.data['currently-reading'] || []);

            const activityResponse = await axios.get(`${API_URL}/activity/friends`);
            setActivityFeed(activityResponse.data.activities || []);

            const goalsResponse = await axios.get(`${API_URL}/goals`);
            setGoals(goalsResponse.data.goals || []);

        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openProgressModal = (book) => {
        setSelectedBook(book);
        setShowProgressModal(true);
    };

    const updateProgress = async (currentPage) => {
        try {
            await axios.put(`${API_URL}/books/progress/${encodeURIComponent(selectedBook.key)}`, {
                currentPage
            });

            setCurrentlyReading(prev =>
                prev.map(book =>
                    book.key === selectedBook.key
                        ? { ...book, currentPage }
                        : book
                )
            );

            setShowProgressModal(false);
            alert('Progress updated!');
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Error updating progress');
        }
    };

    const moveBook = async (book, toLibrary) => {
        try {
            await axios.put(`${API_URL}/libraries/move`, {
                bookKey: book.key,
                fromLibrary: 'currently-reading',
                toLibrary: toLibrary
            });

            setCurrentlyReading(prev => prev.filter(b => b.key !== book.key));

            const libraryNames = {
                'to-read': 'To Read',
                'read': 'Read',
                'paused': 'Paused',
                'dnf': 'Did Not Finish'
            };
            alert(`Moved "${book.title}" to ${libraryNames[toLibrary]}!`);
        } catch (error) {
            console.error('Error moving book:', error);
            alert('Error moving book');
        }
    };

    const deleteGoal = async (goalId) => {
        if (!window.confirm('Delete this goal?')) return;

        try {
            await axios.delete(`${API_URL}/goals/${goalId}`);
            setGoals(prev => prev.filter(g => g._id !== goalId));
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Error deleting goal');
        }
    };

    const toggleLike = async (activityId, activityIndex) => {
        try {
            const response = await axios.post(`${API_URL}/activity/${activityId}/like`);

            setActivityFeed(prevActivities => {
                const updated = [...prevActivities];
                updated[activityIndex] = {
                    ...updated[activityIndex],
                    isLikedByCurrentUser: response.data.liked,
                    likesCount: response.data.likesCount
                };
                return updated;
            });
        } catch (error) {
            console.error('Error liking review:', error);
            if (error.response?.status === 401) {
                alert('Please log in to like reviews');
            } else if (error.response?.status === 400) {
                alert(error.response?.data?.error || 'Cannot like this review');
            }
        }
    };

    const indexOfLastActivity = currentPage * activitiesPerPage;
    const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
    const currentActivities = activityFeed.slice(indexOfFirstActivity, indexOfLastActivity);
    const totalPages = Math.ceil(activityFeed.length / activitiesPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const activityDate = new Date(date);
        const seconds = Math.floor((now - activityDate) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return activityDate.toLocaleDateString();
    };

    if (authLoading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="home-container">
                <div className="error-container">
                    <h2>Not Authenticated</h2>
                    <p>Please <Link to="/login">log in</Link> to view your home page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="home-container">
                <div className="loading">Loading your reading activity...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-container">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={fetchHomeData} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-layout">
                <aside className="home-sidebar">
                    <div className="sidebar-section currently-reading-section">
                        <h2>.✦ ݁˖ Currently Reading</h2>
                        {currentlyReading.length === 0 ? (
                            <p className="empty-state">No books in progress. <Link to="/search">Find a book!</Link></p>
                        ) : (
                            <div className="currently-reading-list">
                                {currentlyReading.map((book) => (
                                    <div key={book.key} className="reading-book-card">
                                        <Link to={`/book${book.key}`} className="book-cover-link">
                                            {book.coverUrl ? (
                                                <img src={book.coverUrl} alt={book.title} />
                                            ) : (
                                                <div className="no-cover-mini">📕</div>
                                            )}
                                        </Link>

                                        <div className="reading-book-info">
                                            <Link to={`/book${book.key}`} className="book-title-link">
                                                <h4>{book.title}</h4>
                                            </Link>
                                            <p className="home-book-author">{book.author}</p>

                                            {book.numberOfPages && book.numberOfPages > 0 && (
                                                <div className="mini-progress">
                                                    <div className="mini-progress-bar">
                                                        <div
                                                            className="mini-progress-fill"
                                                            style={{
                                                                width: `${Math.min((book.currentPage || 0) / book.numberOfPages * 100, 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="mini-progress-text">
                                                        {book.currentPage || 0} / {book.numberOfPages} pages
                                                    </p>
                                                </div>
                                            )}

                                            <div className="reading-actions">
                                                <button
                                                    onClick={() => openProgressModal(book)}
                                                    className="btn-mini-update"
                                                >
                                                    Update Progress
                                                </button>

                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            moveBook(book, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="move-dropdown-mini"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Move to...</option>
                                                    <option value="to-read">To Read</option>
                                                    <option value="read">Read</option>
                                                    <option value="paused">Paused</option>
                                                    <option value="dnf">Did Not Finish</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section goals-section">
                        <Goals
                            goals={goals}
                            onDelete={deleteGoal}
                            isOwnProfile={true}
                        />
                        <Link to="/stats" className="btn-view-stats">
                            View Full Stats →
                        </Link>
                    </div>
                </aside>

                <main className="home-main">
                    <div className="welcome-header">
                        <h1>Welcome back, {user?.username}!</h1>
                        <p className="welcome-subtitle">See what your friends are reading!</p>
                    </div>

                    <div className="activity-feed-section">
                        <h2>⏾ Recent Activity</h2>
                        {activityFeed.length > 0 && (
                            <p className="home-activity-count">
                                Showing {indexOfFirstActivity + 1}-{Math.min(indexOfLastActivity, activityFeed.length)} of {activityFeed.length}
                            </p>
                        )}
                        {activityFeed.length === 0 ? (
                            <p className="empty-state">No recent activity to show.</p>
                        ) : (
                            <div className="activity-feed">
                                {currentActivities.map((activity) => (
                                    <div key={activity._id} className="home-activity-item">
                                        <div className="home-activity-content">
                                            <div className="activity-header">
                                                <div className="home-activity-text">
                                                    <ActivityText activity={activity} />
                                                </div>
                                                <span className="home-activity-time">
                                                    {formatTimeAgo(activity.createdAt)}
                                                </span>
                                            </div>

                                            {activity.book?.coverUrl && (
                                                <Link to={`/book${activity.book.key}`} className="home-activity-book-preview">
                                                    <img
                                                        src={activity.book.coverUrl}
                                                        alt={activity.book.title}
                                                    />
                                                    <span>{activity.book.title}</span>
                                                </Link>
                                            )}

                                            {activity.activityType === 'reviewed_book' && activity.review && (
                                                <div className="activity-review">
                                                    {activity.containsSpoilers ? (
                                                        <SpoilerReview
                                                            review={activity.review}
                                                            bookTitle={activity.book?.title}
                                                        />
                                                    ) : (
                                                        <p className="review-text">"{activity.review}"</p>
                                                    )}
                                                    <button
                                                        onClick={() => toggleLike(activity._id, activityFeed.indexOf(activity))}
                                                        className={`activity-like-button ${activity.isLikedByCurrentUser ? 'liked' : ''}`}
                                                    >
                                                        <span className="like-icon">
                                                            {activity.isLikedByCurrentUser ? '❤️' : '🤍'}
                                                        </span>
                                                        <span className="like-count">
                                                            {activity.likesCount || 0}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
                            {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    ← Previous
                                </button>

                                <div className="pagination-numbers">
                                    {currentPage > 2 && (
                                        <>
                                            <button onClick={() => goToPage(1)} className="pagination-number">
                                                1
                                            </button>
                                            {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                                        </>
                                    )}

                                    {currentPage > 1 && (
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            className="pagination-number"
                                        >
                                            {currentPage - 1}
                                        </button>
                                    )}

                                    <button className="pagination-number active">
                                        {currentPage}
                                    </button>

                                    {currentPage < totalPages && (
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            className="pagination-number"
                                        >
                                            {currentPage + 1}
                                        </button>
                                    )}

                                    {currentPage < totalPages - 1 && (
                                        <>
                                            {currentPage < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
                                            <button
                                                onClick={() => goToPage(totalPages)}
                                                className="pagination-number"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showProgressModal && (
                <PageProgressModal
                    book={selectedBook}
                    onClose={() => setShowProgressModal(false)}
                    onSubmit={updateProgress}
                />
            )}
        </div>
    );
}

export default Home;