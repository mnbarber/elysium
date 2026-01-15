import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ActivityFeed.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendsActivity();
  }, []);

  const fetchFriendsActivity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/activity/friends`);
      console.log('Fetched friends activity:', response.data.activities);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching friends activity:', error);
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
    return <div className="loading">Loading friends' activity...</div>;
  }

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <h1>Friends' Activity</h1>
        <p className="activity-subtitle">See what your friends are reading</p>
      </div>

      {activities.length === 0 ? (
        <div className="empty-activity-state">
          <p>No activity from friends yet.</p>
          <p>Add some friends to see their reading activity!</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
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
                      <details className="spoiler-review">
                        <summary className="spoiler-warning">
                          ⚠️ This review contains spoilers (click to reveal)
                        </summary>
                        <p className="review-text">"{activity.review}"</p>
                      </details>
                    ) : (
                      <p className="review-text">"{activity.review}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;