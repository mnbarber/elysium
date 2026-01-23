import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NewMessageModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function NewMessageModal({ onClose }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const delayDebounce = setTimeout(() => {
                searchUsers();
            }, 300);
            return () => clearTimeout(delayDebounce);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/friends`);
            setFriends(response.data.friends || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/search`, {
                params: { q: searchQuery }
            });
            setSearchResults(response.data.users || []);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleSelectUser = (user) => {
        navigate(`/messages/${user._id}`);
        onClose();
    };

    const displayUsers = searchQuery.trim() ? searchResults : friends;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="new-message-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Message</h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-search">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        autoFocus
                    />
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="modal-loading">Loading...</div>
                    ) : displayUsers.length === 0 ? (
                        <div className="modal-empty">
                            {searchQuery.trim() ? (
                                <p>No users found for "{searchQuery}"</p>
                            ) : (
                                <>
                                    <p>No friends yet</p>
                                    <p className="modal-empty-subtitle">Add friends to message them!</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="users-list">
                            {!searchQuery.trim() && (
                                <div className="section-label">Your Friends</div>
                            )}
                            {displayUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="user-item"
                                    onClick={() => handleSelectUser(user)}
                                >
                                    {user.profile?.avatarUrl ? (
                                        <img
                                            src={user.profile.avatarUrl}
                                            alt={user.username}
                                            className="user-avatar"
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="user-details">
                                        <span className="user-name">
                                            {user.profile?.displayName || user.username}
                                        </span>
                                        <span className="user-username">@{user.username}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NewMessageModal;