import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {

    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>♥ elysium</h3>
                    <p>Your personal book tracking and social reading platform</p>
                    <p className="footer-text">
                        Made with 📚 and ☕ by{' '}
                        <a
                            href="https://github.com/mnbarber"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                        >
                            Megan Barber
                        </a>
                    </p>
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
                    <a href="https://www.paypal.com/paypalme/megameganx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="donation-button"
                        >
                            <span className="donation-text">Buy me a </span>
                            <span className="paypal-icon">☕</span>
                        </a>
                        <p className="donation-subtext">Support elysium's development</p>
                </div>

            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Elysium. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;