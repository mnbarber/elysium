import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Profile() {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('to-read');

  useEffect(() => {
    fetchProfile();
  }, [username]);

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
          <h1>{profile.displayName}</h1>
          <p className="username">@{profile.username}</p>
          {profile.bio && <p className="bio">{profile.bio}</p>}
        </div>
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
          </div>

          <div className="profile-books">
            {libraries[activeTab].length === 0 ? (
              <p className="empty-library">No books in this library</p>
            ) : (
              <div className="books-grid">
                {libraries[activeTab].map((book) => (
                  <div key={book.key} className="book-card-mini">
                    {book.coverUrl && (
                      <img src={book.coverUrl} alt={book.title} />
                    )}
                    <div className="book-details">
                      <h4>{book.title}</h4>
                      <p>{book.author}</p>
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