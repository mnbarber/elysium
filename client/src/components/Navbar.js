import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import axios from 'axios';
import UnifiedSearch from './UnifiedSearch';
import './Navbar.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`${API_URL}/messages/unread-count`);
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                ☾⋆｡ elysium
            </Link>

            {isAuthenticated && (
                <div className="navbar-search-wrapper">
                    <UnifiedSearch />
                </div>
            )}

            {isAuthenticated ? (
                <>
                    <button
                        className="mobile-menu-toggle"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>

                    <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <Link to="/search" onClick={closeMobileMenu}>Search Books</Link>
                        <Link to="/browse" onClick={closeMobileMenu}>Browse</Link>
                        <Link to="/lists/browse" onClick={closeMobileMenu}>Lists</Link>
                        <Link to="/discover" onClick={closeMobileMenu}>Discover</Link>
                        <Link to="/libraries" onClick={closeMobileMenu}>Libraries</Link>
                        <Link to={`/profile/${user.username}`} onClick={closeMobileMenu}>Profile</Link>
                        <Link to="/friends" onClick={closeMobileMenu}>Friends</Link>
                        <Link to="/stats" onClick={closeMobileMenu}>Stats</Link>
                        <Link to="/messages" className="messages-link" onClick={closeMobileMenu}>
                            Chat
                            {unreadCount > 0 && (
                                <span className="unread-badge">{unreadCount}</span>
                            )}
                        </Link>
                        <Link to="/settings" onClick={closeMobileMenu}>Settings</Link>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <button
                        className="mobile-menu-toggle"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>

                    <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <Link to="/login" onClick={closeMobileMenu}>Login</Link>
                        <Link to="/register" onClick={closeMobileMenu}>Register</Link>
                    </div>
                </>
            )}
        </nav>
    );
}

export default Navbar;