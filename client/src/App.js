import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { useAuth } from './context/authContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import UserSearch from './components/UserSearch';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [libraries, setLibraries] = useState({
    'to-read': [],
    'currently-reading': [],
    'read': [],
    'paused': [],
    'dnf': []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLibraries();
    }
  }, [user]);

  const fetchLibraries = async () => {
    try {
      const response = await axios.get(`${API_URL}/libraries`);
      setLibraries(response.data);
    } catch (error) {
      console.error('Error fetching libraries:', error);
    }
  };

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/books/search`, {
        params: { q: searchQuery }
      });
      setSearchResults(response.data.docs || []);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (book, libraryName) => {
    try {
      const bookData = {
        key: book.key,
        title: book.title,
        author: book.author_name?.[0] || 'Unknown',
        coverUrl: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null,
        firstPublishYear: book.first_publish_year
      };

      await axios.post(`${API_URL}/libraries/${libraryName}`, bookData);
      await fetchLibraries();
      alert('Book added successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding book');
    }
  };

  const removeFromLibrary = async (bookKey, libraryName) => {
    try {
      await axios.delete(`${API_URL}/libraries/${libraryName}/${encodeURIComponent(bookKey)}`);
      await fetchLibraries();
    } catch (error) {
      console.error('Error removing book:', error);
    }
  };

  const moveBook = async (book, fromLibrary, toLibrary) => {
    try {
      await axios.post(`${API_URL}/libraries/move`, {
        book,
        fromLibrary,
        toLibrary
      });
      await fetchLibraries();
    } catch (error) {
      console.error('Error moving book:', error);
    }
  };

  return (
    <div className="home-page">
      <nav className="tabs">
        <button 
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Search Books
        </button>
        <button 
          className={activeTab === 'libraries' ? 'active' : ''}
          onClick={() => setActiveTab('libraries')}
        >
          My Libraries
        </button>
      </nav>

      {activeTab === 'search' && (
        <div className="search-section">
          <form onSubmit={searchBooks}>
            <input
              type="text"
              placeholder="Search for books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {loading && <p>Searching...</p>}

          <div className="search-results">
            {searchResults.map((book) => (
              <div key={book.key} className="book-card">
                {book.cover_i && (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                    alt={book.title}
                  />
                )}
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p>by {book.author_name?.[0] || 'Unknown'}</p>
                  <p className="year">{book.first_publish_year}</p>
                  <div className="button-group">
                    <button onClick={() => addToLibrary(book, 'to-read')}>
                      To Read
                    </button>
                    <button onClick={() => addToLibrary(book, 'currently-reading')}>
                      Currently Reading
                    </button>
                    <button onClick={() => addToLibrary(book, 'read')}>
                      Read
                    </button>
                    <button onClick={() => addToLibrary(book, 'paused')}>
                      Paused
                    </button>
                    <button onClick={() => addToLibrary(book, 'dnf')}>
                      DNF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'libraries' && (
        <div className="libraries-section">
          {Object.entries(libraries).map(([libraryName, books]) => (
            <div key={libraryName} className="library">
              <h2>
                {libraryName === 'dnf' 
                  ? 'DNF (Did Not Finish)' 
                  : libraryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }
              </h2>
              <div className="library-books">
                {books.length === 0 ? (
                  <p className="empty">No books in this library yet</p>
                ) : (
                  books.map((book) => (
                    <div key={book.key} className="library-book-card">
                      {book.coverUrl && <img src={book.coverUrl} alt={book.title} />}
                      <div className="book-info">
                        <h4>{book.title}</h4>
                        <p>by {book.author}</p>
                        <select
                          onChange={(e) => {
                            if (e.target.value === 'remove') {
                              removeFromLibrary(book.key, libraryName);
                            } else {
                              moveBook(book, libraryName, e.target.value);
                            }
                            e.target.value = '';
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Move to...</option>
                          {Object.keys(libraries)
                            .filter(lib => lib !== libraryName)
                            .map(lib => (
                              <option key={lib} value={lib}>
                                {lib === 'dnf' 
                                  ? 'DNF (Did Not Finish)' 
                                  : lib.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                }
                              </option>
                            ))}
                          <option value="remove">Remove</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <Router>
      <div className="App">
        <header>
          <Link to="/" className="logo">
            <h1>elysium</h1>
          </Link>
          <nav className="header-nav">
            <Link to="/users">Find Users</Link>
            <Link to={`/profile/${user.username}`}>My Profile</Link>
            <Link to="/edit-profile">Edit Profile</Link>
          </nav>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/users" element={<UserSearch />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;