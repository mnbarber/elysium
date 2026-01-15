import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PageProgressModal from './PageProgressModal';
import Goals from './Goals';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Home() {
    const [user, setUser] = useState(null);
    const [currentlyReading, setCurrentlyReading] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        try {
            setLoading(true);

            const userResponse = await axios.get(`${API_URL}/auth/me`);
            setUser(userResponse.data);

            const librariesResponse = await axios.get(`${API_URL}/libraries`);
            setCurrentlyReading(librariesResponse.data['currently-reading'] || []);

            const activityResponse = await axios.get(`${API_URL}/activity/public`);
            console.log('Public activity response:', activityResponse.data);
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

    const getActivityText = (activity) => {
        const username = activity.user?.username || 'Someone';
        const bookTitle = activity.book?.title || 'a book';

        switch (activity.activityType) {
            case 'added_book':
                return (
                    <>
                        <strong>{username}</strong> added <strong>{bookTitle}</strong> to {activity.libraryName}
                    </>
                );
            case 'rated_book':
                return (
                    <>
                        <strong>{username}</strong> rated <strong>{bookTitle}</strong> {activity.rating} stars
                    </>
                );
            case 'moved_book':
                return (
                    <>
                        <strong>{username}</strong> moved <strong>{bookTitle}</strong> to {activity.toLibrary}
                    </>
                );
            case 'finished_book':
                return (
                    <>
                        <strong>{username}</strong> finished reading <strong>{bookTitle}</strong>
                    </>
                );
            case 'reviewed_book':
                return (
                    <>
                        <strong>{username}</strong> reviewed <strong>{bookTitle}</strong>
                    </>
                );
            default:
                return `${username} did something with ${bookTitle}`;
        }
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

    if (loading) {
        return <div className="loading">Loading...</div>;
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
                                            <p className="book-author">{book.author}</p>

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

                                            <button
                                                onClick={() => openProgressModal(book)}
                                                className="btn-mini-update"
                                            >
                                                Update Progress
                                            </button>
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
                        <p className="welcome-subtitle">See what the community is reading</p>
                    </div>

                    <div className="activity-feed-section">
                        <h2>⏾ Recent Activity</h2>

                        {activityFeed.length === 0 ? (
                            <p className="empty-state">No recent activity to show.</p>
                        ) : (
                            <div className="activity-feed">
                                {activityFeed.map((activity) => (
                                    <div key={activity._id} className="activity-item">
                                        <div className="activity-content">
                                            <div className="activity-header">
                                                <p className="activity-text">
                                                    {getActivityText(activity)}
                                                </p>
                                                <span className="activity-time">
                                                    {formatTimeAgo(activity.createdAt)}
                                                </span>
                                            </div>

                                            {activity.book?.coverUrl && (
                                                <Link to={`/book${activity.book.key}`} className="activity-book-preview">
                                                    <img
                                                        src={activity.book.coverUrl}
                                                        alt={activity.book.title}
                                                    />
                                                    <span>{activity.book.title}</span>
                                                </Link>
                                            )}

                                            {activity.activityType === 'reviewed_book' && activity.review && (
                                                <div className="activity-review">
                                                    <p className="review-text">"{activity.review}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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