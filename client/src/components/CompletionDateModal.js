import React, { useState } from 'react';
import './CompletionDateModal.css';

function CompletionDateModal({ book, onClose, onSubmit }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [useCustomDate, setUseCustomDate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const completionDate = useCustomDate ? new Date(selectedDate) : new Date();
    onSubmit(completionDate);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content date-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>When did you finish this book?</h2>
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
          <div className="date-options">
            <label className="date-option">
              <input
                type="radio"
                name="dateOption"
                checked={!useCustomDate}
                onChange={() => setUseCustomDate(false)}
              />
              <span>Just now (today)</span>
            </label>

            <label className="date-option">
              <input
                type="radio"
                name="dateOption"
                checked={useCustomDate}
                onChange={() => setUseCustomDate(true)}
              />
              <span>Pick a date</span>
            </label>
          </div>

          {useCustomDate && (
            <div className="form-group">
              <label>Completion Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <small>When did you finish reading this book?</small>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Mark as Read
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompletionDateModal;