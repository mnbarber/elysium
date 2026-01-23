import React, { useState } from 'react';
import './SpoilerReview.css';

function SpoilerReview({ review, bookTitle }) {
    const [isRevealed, setIsRevealed] = useState(false);

    if (!isRevealed) {
        return (
            <div className="spoiler-review-hidden">
                <div className="spoiler-warning">
                    <span className="warning-icon">⚠️</span>
                    <p className="warning-text">This review contains spoilers for <strong>{bookTitle}</strong></p>
                    <button
                        className="reveal-button"
                        onClick={() => setIsRevealed(true)}
                    >
                        Show Review
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="spoiler-review-revealed">
            <div className="spoiler-badge">
                ⚠️ Contains Spoilers
            </div>
            <p className="review-text">{review}</p>
            <button
                className="hide-button"
                onClick={() => setIsRevealed(false)}
            >
                Hide Review
            </button>
        </div>
    );
}

export default SpoilerReview;