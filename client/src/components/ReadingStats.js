import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReadingStats.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ReadingStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/stats/reading`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching reading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (monthIndex) => {
        const months = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ];
        return months[monthIndex];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div>Loading reading stats...</div>;
    }

    if (!stats) {
        return <div>No reading stats available.</div>;
    }

    const maxMonthlyBooks = Math.max(...Object.values(stats.monthlyBreakdown), 1);

  return (
    <div className="stats-container">
      <h1>Reading Statistics</h1>

      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-number">{stats.booksThisYear}</div>
          <div className="stat-label">Books Read in {stats.currentYear}</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.booksThisMonth}</div>
          <div className="stat-label">Books This Month</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.totalBooksRead}</div>
          <div className="stat-label">Total Books Read</div>
        </div>
      </div>

      <div className="monthly-chart">
        <h2>Monthly Breakdown - {stats.currentYear}</h2>
        <div className="chart">
          {Object.entries(stats.monthlyBreakdown).map(([month, count]) => (
            <div key={month} className="chart-bar-container">
              <div
                className="chart-bar"
                style={{
                  height: `${(count / maxMonthlyBooks) * 200}px`,
                  backgroundColor: count > 0 ? '#667eea' : '#e0e0e0'
                }}
              >
                {count > 0 && <span className="bar-count">{count}</span>}
              </div>
              <div className="chart-label">{getMonthName(parseInt(month))}</div>
            </div>
          ))}
        </div>
      </div>

      {stats.recentlyFinished && stats.recentlyFinished.length > 0 && (
        <div className="recently-finished">
          <h2>Recently Finished</h2>
          <div className="finished-books-list">
            {stats.recentlyFinished.map((book, index) => (
              <div key={index} className="finished-book-item">
                <div className="book-details">
                  <h4>{book.title}</h4>
                  <p>by {book.author}</p>
                </div>
                <div className="completion-date">
                  {formatDate(book.completedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingStats;