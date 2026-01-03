import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import './EditProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile from:', `${API_URL}/profile/${user.username}`);
      const response = await axios.get(`${API_URL}/profile/${user.username}`);
      const profile = response.data.profile;
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        isPublic: profile.isPublic !== false
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataToSend = {
        ...formData,
      };

      await axios.put(`${API_URL}/profile/${user.username}/edit`, dataToSend);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate(`/profile/${user.username}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile</h1>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-group">
          <label>Display Name</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="How should people see your name?"
          />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows="4"
            maxLength="500"
          />
          <small>{formData.bio.length}/500 characters</small>
        </div>

        <div className="form-group">
          <label>Avatar URL</label>
          <input
            type="url"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />
          <small>Link to your profile picture</small>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            Make my profile public
          </label>
          <small>Allow others to view your profile and book lists</small>
        </div>

        <div className="button-group">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate(`/profile/${user.username}`)}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;