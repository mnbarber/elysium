import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/authContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import UserSearch from './components/UserSearch';
import Friends from './components/Friends';
import ActivityFeed from './components/ActivityFeed';
import BrowseByGenre from './components/BrowseByGenre';
import ReadingStats from './components/ReadingStats';
import BookDetails from './components/BookDetails';
import AddCustomBook from './components/AddCustomBook';
import MyLists from './components/MyLists';
import ListDetail from './components/ListDetail';
import BrowseLists from './components/BrowseLists';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import SearchBooks from './components/SearchBooks';
import Libraries from './components/Libraries';

function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="*"
            element={
              showRegister ? (
                <Register
                  onSwitchToLogin={() => setShowRegister(false)}
                  setShowRegister={setShowRegister}
                />
              ) : (
                <Login
                  onSwitchToRegister={() => setShowRegister(true)}
                  setShowRegister={setShowRegister}
                />
              )
            }
          />
        </Routes>
      </Router>
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
            <Link to="/search">Search</Link>
            <Link to="/browse">Browse</Link>
            <Link to="/lists/browse">Lists</Link>
            <Link to="/feed">Friend Feed</Link>
            <Link to="/users">Find Users</Link>
            <Link to="/libraries">My Libraries</Link>
            <Link to={`/profile/${user.username}`}>Profile</Link>
            <Link to="/lists">My Lists</Link>
            <Link to="/stats">My Stats</Link>
          </nav>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>

        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/search" />} />
          <Route path="/search" element={<SearchBooks />} />
          <Route path="/browse" element={<BrowseByGenre />} />
          <Route path="/book/*" element={<BookDetails />} />
          <Route path="/add-book" element={<AddCustomBook />} />
          <Route path="/lists" element={<MyLists />} />
          <Route path="/lists/browse" element={<BrowseLists />} />
          <Route path="/lists/:listId" element={<ListDetail />} />
          <Route path="/feed" element={<ActivityFeed />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile/:username/edit" element={<EditProfile />} />
          <Route path="/stats" element={<ReadingStats />} />
          <Route path="/users" element={<UserSearch />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;