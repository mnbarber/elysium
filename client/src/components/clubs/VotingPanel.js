import { useEffect, useState } from 'react';
import axios from 'axios';
import './VotingPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function VotingPanel({ clubId }) {
    const [session, setSession] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/bookclubs/${clubId}/votes/current`).then(r => setSession(r.data));
    }, [clubId]);

    const searchBooks = async () => {
        const r = await axios.get(`${API_URL}/books/search?q=${searchQuery}`);
        setSearchResults(r.data);
    };

    const nominate = async (book) => {
        const r = await axios.post(`${API_URL}/bookclubs/${clubId}/votes/nominate`, { book });
        setSession(r.data);
        setSearchResults([]);
    };

    const vote = async (nominationId) => {
        const r = await axios.post(`${API_URL}/bookclubs/${clubId}/votes/${nominationId}/vote`);
        setSession(r.data);
    };

    if (!session) return <div>Loading votes...</div>;

    return (
        <div className="voting-panel">
            <h2>This Month's Vote</h2>
            <div className="nominations">
                {session.nominations.map(n => (
                    <div key={n._id} className="nomination-card">
                        {n.book.cover && <img src={n.book.cover} alt={n.book.title} />}
                        <div>
                            <strong>{n.book.title}</strong>
                            <span>{n.book.author}</span>
                            <span>Nominated by {n.nominatedBy?.displayName}</span>
                        </div>
                        <button onClick={() => vote(n._id)}>
                            👍 {n.votes.length}
                        </button>
                    </div>
                ))}
            </div>
            <div className="nominate-section">
                <h3>Nominate a Book</h3>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search books..." />
                <button onClick={searchBooks}>Search</button>
                {searchResults.map(book => (
                    <div key={book.openLibraryId} className="search-result">
                        <span>{book.title} — {book.author}</span>
                        <button onClick={() => nominate(book)}>Nominate</button>
                    </div>
                ))}
            </div>
        </div>
    );
}