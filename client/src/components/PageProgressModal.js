import React, { useState, useEffect } from 'react';
import './PageProgressModal.css';

function PageProgressModal({ book, onClose, onSubmit }) {
    const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
    const totalPages = book.numberOfPages || 0;
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    useEffect(() => {
        setCurrentPage(book.currentPage || 0);
    }, [book.currentPage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const pageNum = parseInt(currentPage);
        if (pageNum >= 0) {
            onSubmit(pageNum);
        }
    };

    const handleQuickUpdate = (pages) => {
        const newPage = Math.max(0, Math.min(currentPage + pages, totalPages || Infinity));
        setCurrentPage(newPage);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content page-progress-modal" onClick={e => e.stopPropagation()}>
                <h2>Update Reading Progress</h2>
                <p className="book-title">{book.title}</p>

                <form onSubmit={handleSubmit}>
                    <div className="current-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            {currentPage} / {totalPages > 0 ? totalPages : '?'} pages ({progress}%)
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Current Page</label>
                        <input
                            type="number"
                            value={currentPage}
                            onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                            min="0"
                            max={totalPages || undefined}
                            required
                        />
                    </div>

                    <div className="quick-updates">
                        <button
                            type="button"
                            onClick={() => handleQuickUpdate(-10)}
                            className="btn-quick"
                        >
                            -10
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickUpdate(-1)}
                            className="btn-quick"
                        >
                            -1
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickUpdate(1)}
                            className="btn-quick"
                        >
                            +1
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickUpdate(10)}
                            className="btn-quick"
                        >
                            +10
                        </button>
                    </div>

                    {totalPages > 0 && currentPage >= totalPages && (
                        <div className="completion-notice">
                            ♥ You've finished this book! Consider moving it to "Read".
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Update Progress
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PageProgressModal;