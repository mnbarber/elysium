import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import StarRating from './StarRating';
import SpoilerReview from './SpoilerReview';
import Goals from './Goals';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('to-read');

  useEffect(() => {
    fetchProfile();
    if (user && user.username !== username) {
      fetchFriendshipStatus();
    }
    fetchGoals();
  }, [username, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/profile/${username}`);
      setProfileData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    console.log('fetching goals for user:', user);
    try {
      const response = await axios.get(`${API_URL}/goals/user/${user._id}`);
      setGoals(response.data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchFriendshipStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/status/${username}`);
      setFriendshipStatus(response.data);
    } catch (err) {
      console.error('Error fetching friendship status:', err);
    }
  };

  const sendFriendRequest = async () => {
    try {
      await axios.post(`${API_URL}/friends/request/${username}`);
      alert('Friend request sent!');
      fetchFriendshipStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Error sending friend request');
    }
  };

  const acceptFriendRequest = async () => {
    try {
      await axios.post(`${API_URL}/friends/accept/${friendshipStatus.requestId}`);
      alert('Friend request accepted!');
      fetchFriendshipStatus();
    } catch (err) {
      alert('Error accepting friend request');
    }
  };

  const removeFriend = async () => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/profile/${username}`);
      const friendUserId = response.data.profile.username;
      
      await axios.delete(`${API_URL}/friends/${friendUserId}`);
      alert('Friend removed');
      fetchFriendshipStatus();
    } catch (err) {
      alert('Error removing friend');
    }
  };

  const renderFriendButton = () => {
    if (!friendshipStatus || friendshipStatus.status === 'self') {
      return null;
    }

    switch (friendshipStatus.status) {
      case 'none':
        return (
          <button className="btn-add-friend" onClick={sendFriendRequest}>
            Add Friend
          </button>
        );
      case 'pending_sent':
        return (
          <button className="btn-pending" disabled>
            Request Sent
          </button>
        );
      case 'pending_received':
        return (
          <button className="btn-accept-friend" onClick={acceptFriendRequest}>
            Accept Friend Request
          </button>
        );
      case 'friends':
        return (
          <button className="btn-remove-friend" onClick={removeFriend}>
            Remove Friend
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>😕 {error}</h2>
        <Link to="/">Go back home</Link>
      </div>
    );
  }

  if (!profileData) {
    return <div className="error-container">Profile not found</div>;
  }

  const { profile, stats, libraries } = profileData;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} />
          ) : (
            <div className="avatar-placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-title-row">
            <div>
              <h1>{profile.displayName}</h1>
              <p className="username">@{profile.username}</p>
            </div>
            {user && user.username === username ? (
              <>
              <Link to={`/profile/${user.username}/edit`} className="btn-edit-profile">
                Edit Profile
              </Link>
              <Link to="/friends" className='btn-edit-profile'>Your Friends</Link>
              </>
            ) : (
              renderFriendButton()
            )}
          </div>
          {profile.bio && <p className="bio">{profile.bio}</p>}
        </div>
        <Goals
          goals={goals}
          onDelete={() => { }}
          isOwnProfile={false}
        />
      </div>

      <div className="profile-stats">
        <div className="stat">
          <div className="stat-number">{stats.toReadCount}</div>
          <div className="stat-label">To Read</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.currentlyReadingCount}</div>
          <div className="stat-label">Currently Reading</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.readCount}</div>
          <div className="stat-label">Read</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.pausedCount}</div>
          <div className="stat-label">Paused</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.dnfCount}</div>
          <div className="stat-label">DNF</div>
        </div>
      </div>

      {libraries && (
        <>
          <div className="profile-tabs">
            <button
              className={activeTab === 'to-read' ? 'active' : ''}
              onClick={() => setActiveTab('to-read')}
            >
              To Read ({stats.toReadCount})
            </button>
            <button
              className={activeTab === 'currently-reading' ? 'active' : ''}
              onClick={() => setActiveTab('currently-reading')}
            >
              Currently Reading ({stats.currentlyReadingCount})
            </button>
            <button
              className={activeTab === 'read' ? 'active' : ''}
              onClick={() => setActiveTab('read')}
            >
              Read ({stats.readCount})
            </button>
            <button
              className={activeTab === 'paused' ? 'active' : ''}
              onClick={() => setActiveTab('paused')}
            >
              Paused ({stats.pausedCount})
            </button>
            <button
              className={activeTab === 'dnf' ? 'active' : ''}
              onClick={() => setActiveTab('dnf')}
            >
              DNF ({stats.dnfCount})
            </button>
          </div>

          <div className="profile-books">
            {libraries[activeTab].length === 0 ? (
              <p className="empty-library">No books in this library</p>
            ) : (
                <div className="books-grid">
                  {libraries[activeTab].map((book) => (
                    <div key={book.key} className="book-card-mini">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} />
                      ) : (
                        <img src='https://i.imgur.com/GxzWr9n.jpeg' />
                      )}
                      <div className="book-details">
                        <Link to={`/book/${book.key}`} className="book-title-link">
                          <h3>{book.title}</h3>
                        </Link>
                        <p>{book.author}</p>
                        {activeTab === 'read' && book.rating > 0 && (
                          <div className="book-rating-display">
                            <StarRating rating={book.rating} readonly size="small" />
                          </div>
                        )}
                        <div className="book-title-row">
                          {activeTab === 'currently-reading' && book.readCount > 0 && (
                            <span className="reread-badge">
                              {book.readCount === 1 ? 'Re-read' : `Re-read (${book.readCount}x)`}
                            </span>
                          )}
                        </div>
                        {book.review && (
                          book.containsSpoilers ? (
                            <SpoilerReview
                              review={book.review}
                              bookTitle={book.title}
                            />
                          ) : (
                            <div className='profile-book-review'>
                            <p className="review-text">{book.review}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;