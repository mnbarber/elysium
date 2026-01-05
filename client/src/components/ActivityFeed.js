import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import './ActivityFeed.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState({});

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities/feed`);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReview = (activityId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const getActivityMessage = (activity) => {
    switch (activity.activityType) {
      case 'added_book':
        return `added "${activity.book.title}" to ${formatLibraryName(activity.libraryName)}`;
      case 'rated_book':
        return `rated "${activity.book.title}"`;
      case 'reviewed_book':
        return `reviewed "${activity.book.title}"`;
      case 'moved_book':
        if (activity.toLibrary === 'currently-reading' && activity.book?.readCount > 0) {
          return `is re-reading "${activity.book.title}"`;
        }
        return `moved "${activity.book.title}" to ${formatLibraryName(activity.toLibrary)}`;
      case 'finished_book':
        return `finished reading "${activity.book.title}"`;
      default:
        return 'did something with a book';
    }
  };

  const formatLibraryName = (libraryName) => {
    if (libraryName === 'dnf') return 'DNF';
    return libraryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  };

  if (loading) {
    return <div className="loading">Loading activity feed...</div>;
  }

  return (
    <div className="activity-feed-container">
      <h1>Friend Activity</h1>

      {activities.length === 0 ? (
        <div className="empty-feed">
          <p>No activity yet. Add some friends to see their reading activity!</p>
          <Link to="/users" className="btn-primary">Find Friends</Link>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <Link to={`/profile/${activity.user.username}`} className="activity-user">
                <div className="activity-avatar">
                  {activity.user.avatarUrl ? (
                    <img src={activity.user.avatarUrl} alt={activity.user.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {activity.user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              <div className="activity-content">
                <div className="activity-header">
                  <Link to={`/profile/${activity.user.username}`} className="user-name">
                    {activity.user.displayName}
                  </Link>
                  <span className="activity-message">{getActivityMessage(activity)}</span>
                  <span className="activity-time">{getTimeAgo(activity.createdAt)}</span>
                </div>

                <div className="activity-book">
                  {activity.book.coverUrl && (
                    <img src={activity.book.coverUrl} alt={activity.book.title} className="activity-book-cover" />
                  )}
                  <div className="activity-book-info">
                    <h4>{activity.book.title}</h4>
                    <p>by {activity.book.author}</p>

                    {activity.activityType === 'rated_book' && activity.rating && (
                      <div className="activity-rating">
                        <StarRating rating={activity.rating} readonly size="small" />
                      </div>
                    )}

                    {activity.activityType === 'reviewed_book' && activity.review && (
                      <div className="activity-review">
                        <p className="review-text">
                          {expandedReviews[activity.id] || activity.review.length <= 200
                            ? activity.review
                            : `${activity.review.substring(0, 200)}...`
                          }
                        </p>
                        {activity.review.length > 200 && (
                          <button
                            className="btn-read-more"
                            onClick={() => toggleReview(activity.id)}
                          >
                            {expandedReviews[activity.id] ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;