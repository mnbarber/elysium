import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddCustomBook.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function AddCustomBook() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverUrl: '',
    description: '',
    numberOfPages: '',
    publishYear: '',
    subjects: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.author.trim()) {
      setError('Title and Author are required.');
      return;
    }

    setLoading(true);

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        coverUrl: formData.coverUrl.trim() || null,
        description: formData.description.trim() || null,
        numberOfPages: formData.numberOfPages ? parseInt(formData.numberOfPages, 10) : null,
        publishYear: formData.publishYear ? parseInt(formData.publishYear, 10) : null,
        subjects: formData.subjects
          .split(',')
          .map(sub => sub.trim())
          .filter(sub => sub.length > 0)
      };

      await axios.post(`${API_URL}/books/custom`, bookData);
      alert('Custom book added successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error adding custom book:', err);
      setError('Failed to add custom book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-custom-book-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Search
      </button>

      <div className="add-custom-book-card">
        <h1>Add a Custom Book</h1>
        <p className="subtitle">Can't find your book? Add it manually to your library!</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter book title"
                required
              />
            </div>

            <div className="form-group">
              <label>Author *</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Enter author name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cover Image URL</label>
            <input
              type="url"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
            />
            <small>Optional: Link to a cover image</small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the book... (optional)"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Pages</label>
              <input
                type="number"
                name="numberOfPages"
                value={formData.numberOfPages}
                onChange={handleChange}
                placeholder="300 (optional)"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Publication Year</label>
              <input
                type="number"
                name="publishYear"
                value={formData.publishYear}
                onChange={handleChange}
                placeholder="2024 (optional)"
                min="1000"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Subjects/Genres</label>
            <input
              type="text"
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              placeholder="Fantasy, Adventure, Young Adult (comma separated) (optional)"
            />
            <small>Separate multiple subjects with commas</small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/')} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Adding...' : 'Add Book to Library'}
            </button>
          </div>
        </form>

        <div className="form-note">
          <p>* Required fields</p>
          <p>Your custom book will be added to your "To Read" library.</p>
        </div>
      </div>
    </div>
  );
}

export default AddCustomBook;