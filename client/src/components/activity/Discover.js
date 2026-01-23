import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SpoilerReview from '../books/SpoilerReview';
import './Discover.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 20;

  useEffect(() => {
    fetchPublicActivity();
  }, []);

  const fetchPublicActivity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/activity/public`);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching public activity:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityText = (activity) => {
    const username = activity.user?.username || 'Someone';
    const bookTitle = activity.book?.title || 'a book';
    
    switch(activity.activityType) {
      case 'added_book':
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}added{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
            {' '}to {activity.libraryName}
          </>
        );
      case 'rated_book':
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}rated{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
            {' '}{activity.rating} stars
          </>
        );
      case 'moved_book':
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}moved{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
            {' '}to {activity.toLibrary}
          </>
        );
      case 'finished_book':
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}finished reading{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
          </>
        );
      case 'reviewed_book':
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}reviewed{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
          </>
        );
      default:
        return (
          <>
            <Link to={`/profile/${username}`} className="username-link">
              {username}
            </Link>
            {' '}did something with{' '}
            <Link to={`/book${activity.book?.key}`} className="book-link">
              {bookTitle}
            </Link>
          </>
        );
    }
  };

  const toggleLike = async (activityId, activityIndex) => {
    try {
      const response = await axios.post(`${API_URL}/activity/${activityId}/like`);

      setActivities(prevActivities => {
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
  const currentActivities = activities.slice(indexOfFirstActivity, indexOfLastActivity);
  const totalPages = Math.ceil(activities.length / activitiesPerPage);

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

  if (loading) {
    return <div className="loading">Discovering readers...</div>;
  }

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <h1>Discover</h1>
        <p className="activity-subtitle">See what the community is reading!</p>
      </div>
      {activities.length > 0 && (
        <p className="activity-count">
          Showing {indexOfFirstActivity + 1}-{Math.min(indexOfLastActivity, activities.length)} of {activities.length}
        </p>
      )}

      {activities.length === 0 ? (
        <div className="empty-activity-state">
          <p>No public activity yet.</p>
        </div>
      ) : (
        <div className="activity-list">
          {currentActivities.map((activity) => (
            <div key={activity._id} className="activity-card">
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
                    <div className="book-preview-info">
                      <span className="book-preview-title">{activity.book.title}</span>
                      <span className="book-preview-author">{activity.book.author}</span>
                    </div>
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
                      onClick={() => toggleLike(activity._id, activities.indexOf(activity))}
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
  )
}

export default ActivityFeed;