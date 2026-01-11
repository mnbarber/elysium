import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>♥ Elysium</h3>
                    <p>Your personal book tracking and social reading platform</p>
                </div>

                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <Link to="/search">Search Books</Link>
                        <Link to="/libraries">My Libraries</Link>
                        <Link to="/browse">Browse Books</Link>
                        <Link to="/lists/browse">Public Lists</Link>
                        <Link to="/users">Find Users</Link>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Support</h4>
                    <ul>
                        <Link to="/faq">FAQ</Link>
                        <Link to="/contact">Contact Us</Link>
                    </ul>
                </div>

            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Elysium. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;