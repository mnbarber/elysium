import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Friends.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`);
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/requests`);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/friends/accept/${requestId}`);
      await fetchFriends();
      await fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error accepting friend request');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/friends/reject/${requestId}`);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting friend request');
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/friends/${friendId}`);
      await fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="friends-container">
      <h1>Friends</h1>

      <div className="friends-tabs">
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friends.length})
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Friend Requests ({requests.length})
        </button>
      </div>

      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>You haven't added any friends yet.</p>
              <Link to="/users" className="btn-primary">Find Friends</Link>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="friend-card">
                <Link to={`/profile/${friend.username}`} className="friend-info">
                  <div className="friend-avatar">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.displayName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {friend.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="friend-details">
                    <h3>{friend.displayName}</h3>
                    <p>@{friend.username}</p>
                  </div>
                </Link>
                <button
                  className="btn-remove"
                  onClick={() => removeFriend(friend.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-list">
          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No pending friend requests.</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="request-card">
                <Link to={`/profile/${request.user.username}`} className="request-info">
                  <div className="request-avatar">
                    {request.user.avatarUrl ? (
                      <img src={request.user.avatarUrl} alt={request.user.displayName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {request.user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="request-details">
                    <h3>{request.user.displayName}</h3>
                    <p>@{request.user.username}</p>
                  </div>
                </Link>
                <div className="request-actions">
                  <button
                    className="btn-accept"
                    onClick={() => acceptRequest(request.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => rejectRequest(request.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Friends;