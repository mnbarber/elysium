import React, { useEffect, useState } from 'react';
import './ReviewModal.css';

function ReviewModal({ book, existingReview, onClose, onSubmit, existingSpoilerFlag, onDelete }) {
  const [reviewText, setReviewText] = useState(existingReview || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(existingSpoilerFlag || false)

  useEffect(() => {
    setReviewText(existingReview || '');
    setContainsSpoilers(existingSpoilerFlag || false);
  }, [existingReview, existingSpoilerFlag]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (reviewText.trim().length === 0) {
      alert('Review cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reviewText, containsSpoilers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      onDelete();
    }
  };

  return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingReview ? 'Edit Review' : 'Write a Review'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-book-info">
          {book.coverUrl && (
            <img src={book.coverUrl} alt={book.title} />
          )}
          <div>
            <h3>{book.title}</h3>
            <p>by {book.author}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think about this book?"
              rows="10"
              maxLength="2000"
              autoFocus
            />
            <div className="character-count">
              {reviewText.length}/2000 characters
            </div>
            <div className="spoiler-checkbox">
            <label>
              <input
                type="checkbox"
                checked={containsSpoilers}
                onChange={(e) => setContainsSpoilers(e.target.checked)}
              />
              <span className="checkbox-label">
                ⚠️ This review contains spoilers
              </span>
            </label>
          </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            {existingReview && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-delete-review"
              >
                Delete Review
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-submit">
              {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;