import React, { useState, useEffect } from 'react';
import './EditBookModal.css';

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

    const handleSubmit = (e) => {
        e.preventDefault();

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
                        <label>Cover URL</label>
                        <input
                            type="url"
                            name="coverUrl"
                            value={formData.coverUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/cover.jpg"
                        />
                        {formData.coverUrl && (
                            <div className="cover-preview">
                                <img src={formData.coverUrl} alt="Cover preview" />
                            </div>
                        )}
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