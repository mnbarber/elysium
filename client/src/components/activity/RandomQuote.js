import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './RandomQuote.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function RandomQuote() {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRandomQuote();
    }, []);

    const fetchRandomQuote = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/quotes/random`);
            setQuote(response.data);
        } catch (error) {
            console.error('Error fetching quote:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="random-quote loading">
                <p>Loading quote...</p>
            </div>
        );
    }

    if (!quote) {
        return null;
    }

    return (
        <div className="random-quote">
            <blockquote className="quote-text">
                "{quote.text}"
            </blockquote>
            <div className="quote-attribution">
                <span className="quote-book">— {quote.source}</span>
                <span className="quote-author">by {quote.author}</span>
            </div>
            <div className="quote-actions">
                <Link to="/submit-quote">Submit Quote</Link>
            </div>
        </div>
    );
}

export default RandomQuote;