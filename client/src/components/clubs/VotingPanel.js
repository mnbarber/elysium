import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './VotingPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function VotingPanel({ clubId }) {
    const { user } = useAuth();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [nominatingId, setNominatingId] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/bookclubs/${clubId}/votes/current`)
            .then(r => setSession(r.data))
            .catch(() => setError('Failed to load vote session.'))
            .finally(() => setLoading(false));
    }, [clubId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSearchError('');
        setSearchResults([]);
        try {
            const res = await axios.get(`${API_URL}/books/search`, {
                params: { q: searchQuery }
            });
            const docs = res.data.docs || [];
            const mapped = docs.slice(0, 8).map(doc => ({
                openLibraryId: doc.key,
                title: doc.title,
                author: doc.author_name?.[0] || 'Unknown author',
                cover: doc.cover_i
                    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                    : null,
                year: doc.first_publish_year?.toString() || '',
            }));
            setSearchResults(mapped);
            if (mapped.length === 0) setSearchError('No results found.');
        } catch (err) {
            setSearchError('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const handleNominate = async (book) => {
        setNominatingId(book.openLibraryId);
        try {
            const res = await axios.post(`${API_URL}/bookclubs/${clubId}/votes/nominate`, { book });
            setSession(res.data);
            setSearchResults([]);
            setSearchQuery('');
        } catch (err) {
            setSearchError(err.response?.data?.error || 'Failed to nominate book.');
        } finally {
            setNominatingId(null);
        }
    };

    const handleVote = async (nominationId) => {
        try {
            const res = await axios.post(`${API_URL}/bookclubs/${clubId}/votes/${nominationId}/vote`);
            setSession(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cast vote.');
        }
    };

    const userVotedFor = session?.nominations?.find(n =>
        n.votes.some(v => (v._id || v) === user?._id)
    )?._id;

    const alreadyNominatedIds = new Set(
        session?.nominations?.map(n => n.book.openLibraryId) || []
    );

    const monthLabel = session?.month
        ? new Date(session.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })
        : '';

    if (loading) return (
        <div className="voting-panel__loading">
            <span className="voting-spinner" /> Loading votes...
        </div>
    );

    if (error) return <div className="voting-panel__error">{error}</div>;

    return (
        <div className="voting-panel">

            <div>
                <h2 className="voting-panel__heading">Monthly Vote</h2>
                {monthLabel && (
                    <span className="voting-panel__month">📅 {monthLabel}</span>
                )}
            </div>

            <div>
                <h3 className="voting-panel__subheading">Nominations</h3>

                {session?.nominations?.length === 0 ? (
                    <div className="voting-panel__empty">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <p>No nominations yet. Be the first to nominate a book below!</p>
                    </div>
                ) : (
                    <div className="voting-panel__nominations">
                        {session.nominations
                            .slice()
                            .sort((a, b) => b.votes.length - a.votes.length)
                            .map(nomination => {
                                const hasVoted = userVotedFor === nomination._id;
                                const isLeading = nomination.votes.length > 0 &&
                                    nomination.votes.length === Math.max(...session.nominations.map(n => n.votes.length));
                                return (
                                    <div
                                        key={nomination._id}
                                        className={`nomination-card ${isLeading ? 'nomination-card--leading' : ''}`}
                                    >
                                        {nomination.book.cover
                                            ? <img src={nomination.book.cover} alt={nomination.book.title} className="nomination-card__cover" />
                                            : <div className="nomination-card__cover-placeholder">📖</div>
                                        }
                                        <div className="nomination-card__info">
                                            <p className="nomination-card__title">{nomination.book.title}</p>
                                            <p className="nomination-card__author">{nomination.book.author}</p>
                                            {nomination.nominatedBy && (
                                                <div className="nomination-card__nominated-by">
                                                    {nomination.nominatedBy.avatar
                                                        ? <img src={nomination.nominatedBy.avatar} alt={nomination.nominatedBy.displayName} />
                                                        : <div className="nomination-card__nominated-by-avatar">
                                                            {(nomination.nominatedBy.displayName || nomination.nominatedBy.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    }
                                                    Nominated by {nomination.nominatedBy.displayName || nomination.nominatedBy.username}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className={`nomination-card__vote-btn ${hasVoted ? 'nomination-card__vote-btn--voted' : ''}`}
                                            onClick={() => handleVote(nomination._id)}
                                            disabled={!user}
                                        >
                                            <span className="nomination-card__vote-count">{nomination.votes.length}</span>
                                            <span className="nomination-card__vote-label">{hasVoted ? 'Voted' : 'Vote'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            <div className="nominate-section">
                <h3 className="voting-panel__subheading">Nominate a Book</h3>
                <form onSubmit={handleSearch} className="nominate-search-box">
                    <input
                        type="text"
                        className="nominate-search-box-input"
                        placeholder="Search by title or author..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="nominate-search-box-btn"
                        disabled={searching || !searchQuery.trim()}
                    >
                        {searching ? <><span className="voting-spinner" /> Searching...</> : 'Search'}
                    </button>
                </form>

                {searchError && <div className="voting-panel__error" style={{ marginTop: 10 }}>{searchError}</div>}

                {searchResults.length > 0 && (
                    <div className="voting-panel__results">
                        {searchResults.map(book => {
                            const alreadyNominated = alreadyNominatedIds.has(book.openLibraryId);
                            return (
                                <div key={book.openLibraryId} className="voting-panel__result">
                                    {book.cover
                                        ? <img src={book.cover} alt={book.title} className="voting-panel__result-cover" />
                                        : <div className="voting-panel__result-cover-placeholder">📖</div>
                                    }
                                    <div className="voting-panel__result-info">
                                        <p className="voting-panel__result-title">{book.title}</p>
                                        <p className="voting-panel__result-author">{book.author}</p>
                                        {book.year && <p className="voting-panel__result-year">{book.year}</p>}
                                    </div>
                                    <button
                                        className="voting-panel__nominate-btn"
                                        onClick={() => handleNominate(book)}
                                        disabled={alreadyNominated || nominatingId === book.openLibraryId}
                                    >
                                        {alreadyNominated
                                            ? 'Nominated'
                                            : nominatingId === book.openLibraryId
                                                ? '...'
                                                : 'Nominate'
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}