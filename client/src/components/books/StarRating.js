import React, { useState } from 'react';
import './StarRating.css';

function StarRating({ rating = 0, onRate, readOnly = false, size = 'medium' }) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (value) => {
    if (!readOnly && onRate) {
      onRate(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoveredRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className={`star-rating ${size} ${readOnly ? 'readonly' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= displayRating ? 'filled' : 'empty'}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          aria-label={`Rate ${star} stars`}
        >
          {star <= displayRating ? '★' : '☆'}
        </button>
      ))}
      {rating > 0 && (
        <span className="rating-value">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export default StarRating;