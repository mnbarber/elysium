import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditBookModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function EditBookModal({ book, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        numberOfPages: '',
        firstPublishYear: '',
        description: '',
        coverUrl: '',
        isbn: ''
    });
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');

    useEffect(() => {
        setFormData({
            title: book.title || '',
            author: book.author || '',
            numberOfPages: book.numberOfPages || '',
            firstPublishYear: book.firstPublishYear || '',
            description: book.description || '',
            coverUrl: book.coverUrl || '',
            isbn: book.isbn || ''
        });
    }, [book]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let coverUrl = formData.coverUrl;

            // Upload new cover if selected
            if (coverFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', coverFile);

                const uploadResponse = await axios.post(
                    `${API_URL}/upload/book-cover`,
                    uploadFormData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                coverUrl = uploadResponse.data.imageUrl;
            }
        } catch (error) {
            console.error('Error uploading cover image:', error);
            alert('Failed to upload cover image. Please try again.');
            return;
        }

        const updatedData = {
            ...formData,
            numberOfPages: formData.numberOfPages ? parseInt(formData.numberOfPages) : null,
            firstPublishYear: formData.firstPublishYear ? parseInt(formData.firstPublishYear) : null
        };

        onSubmit(updatedData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-book-modal" onClick={e => e.stopPropagation()}>
                <h2>Edit Book Details</h2>
                <p className="modal-subtitle">Changes will only affect your library copy!</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
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
                            required
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
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>First Published</label>
                            <input
                                type="number"
                                name="firstPublishYear"
                                value={formData.firstPublishYear}
                                onChange={handleChange}
                                min="1"
                                max={new Date().getFullYear()}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>ISBN</label>
                        <input
                            type="text"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Book Cover</label>
                        <div className="cover-upload-section">
                            {coverPreview && (
                                <div className="cover-preview-container">
                                    <img
                                        src={coverPreview}
                                        alt="Cover preview"
                                        className="cover-preview"
                                    />
                                </div>
                            )}
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="cover-upload"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="file-input"
                                />
                                <label htmlFor="cover-upload" className="file-input-label">
                                    {coverFile ? '✓ New cover selected' : '📁 Choose new cover image'}
                                </label>
                            </div>
                            <small>Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Book description..."
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditBookModal;