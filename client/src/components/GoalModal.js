import React, { useState } from 'react';
import './GoalModal.css';

function GoalModal({ onClose, onSubmit }) {
    const [type, setType] = useState('books');
    const [targetValue, setTargetValue] = useState('');
    const [timeframe, setTimeframe] = useState('year');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (targetValue && parseInt(targetValue) > 0) {
            onSubmit({ type, targetValue: parseInt(targetValue), timeframe });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content goal-modal" onClick={e => e.stopPropagation()}>
                <h2>Set a Reading Goal</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Goal Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="books">Number of Books</option>
                            <option value="pages">Number of Pages</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Target</label>
                        <input
                            type="number"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder={type === 'books' ? 'e.g., 50' : 'e.g., 5000'}
                            min="1"
                            required
                        />
                        <span className="input-hint">
                            {type === 'books' ? 'books' : 'pages'}
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Timeframe</label>
                        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="all-time">All Time</option>
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Create Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GoalModal;