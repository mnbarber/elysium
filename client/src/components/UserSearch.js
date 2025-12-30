import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './UserSearch.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { q: query }
      });
      setResults(response.data.users);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search-container">
      <h1>find your friends</h1>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {loading && <p>Searching...</p>}

      <div className="user-results">
        {results.map((user) => (
          <Link 
            to={`/profile/${user.username}`} 
            key={user.username}
            className="user-result-card"
          >
            <div className="user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <div className="avatar-placeholder">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-info">
              <h3>{user.displayName}</h3>
              <p>@{user.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default UserSearch;