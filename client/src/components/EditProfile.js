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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = formData.avatarUrl;

      if (avatarFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', avatarFile);

        const uploadResponse = await axios.post(
          `${API_URL}/upload/profile-picture`,
          uploadFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        avatarUrl = uploadResponse.data.imageUrl;
      }

      await axios.put(`${API_URL}/profile/${user.username}/edit`, {
        ...formData,
        avatarUrl
      });

      alert('Profile updated successfully!');
      navigate(`/profile/${user.username}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
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
          <label>Profile Picture</label>
          <div className="avatar-upload-section">
            {(avatarPreview || formData.avatarUrl) && (
              <img
                src={avatarPreview || formData.avatarUrl}
                alt="Avatar preview"
                className="avatar-preview"
              />
            )}
            <div className="file-upload-box">
              <input
                type="file"
                id="avatar-file-input"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
              <label htmlFor="avatar-file-input" className="file-upload-label">
                <span className="upload-icon">📁</span>
                <span className="upload-text">
                  {avatarFile ? `✓ ${avatarFile.name}` : 'Choose profile picture'}
                </span>
              </label>
            </div>
          </div>
          <small>Max file size: 5MB. Supported formats: JPG, PNG, GIF</small>
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