import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './VotingPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const NOMINATION_LIMIT = 3;

function SpinWheel({ segments, onSpinEnd, isOwner, winner }) {
    const canvasRef = useRef(null);
    const spinStateRef = useRef({
        angle: 0,
        velocity: 0,
        spinning: false,
        targetIndex: null,
    });
    const rafRef = useRef(null);
    const [spinning, setSpinning] = useState(false);
    const [localWinner, setLocalWinner] = useState(winner || null);
    const COLORS = [
        '#667eea', '#764ba2', '#9b7fc7', '#b8a3eb',
        '#5d55da', '#8b6fd8', '#a78bdb', '#c4aef0',
    ];

    const drawWheel = useCallback((angle) => {
        const canvas = canvasRef.current;
        if (!canvas || segments.length === 0) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const cx = W / 2;
        const cy = W / 2;
        const radius = W / 2 - 8;
        const totalSlots = segments.reduce((s, seg) => s + seg.slots, 0);
        const slotAngle = (2 * Math.PI) / totalSlots;

        ctx.clearRect(0, 0, W, W);

        let currentAngle = angle;
        let slotIndex = 0;

        segments.forEach((seg, segIdx) => {
            for (let s = 0; s < seg.slots; s++) {
                const startAngle = currentAngle;
                const endAngle = currentAngle + slotAngle;
                const color = COLORS[segIdx % COLORS.length];

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();

                if (s === 0) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    const labelAngle = startAngle + (slotAngle * seg.slots) / 2;
                    ctx.rotate(labelAngle);
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${Math.max(10, Math.min(14, radius / 8))}px sans-serif`;
                    ctx.shadowColor = 'rgba(0,0,0,0.4)';
                    ctx.shadowBlur = 3;
                    const maxLen = 18;
                    const label = seg.title.length > maxLen ? seg.title.slice(0, maxLen) + '…' : seg.title;
                    ctx.fillText(label, radius - 12, 5);
                    ctx.restore();
                }

                currentAngle = endAngle;
                slotIndex++;
            }
        });

        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(102,126,234,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - 14, 0);
        ctx.lineTo(cx + 14, 0);
        ctx.lineTo(cx, 22);
        ctx.closePath();
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
    }, [segments]);

    useEffect(() => {
        drawWheel(spinStateRef.current.angle);
    }, [drawWheel]);

    const getWinnerAtAngle = useCallback((angle) => {
        const totalSlots = segments.reduce((s, seg) => s + seg.slots, 0);
        if (totalSlots === 0) return null;
        const slotAngle = (2 * Math.PI) / totalSlots;
        const normalised = ((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (3 * Math.PI) / 2;
        const adjusted = (normalised + pointerAngle) % (2 * Math.PI);
        const slotIndex = Math.floor(adjusted / slotAngle) % totalSlots;
        let count = 0;
        for (const seg of segments) {
            count += seg.slots;
            if (slotIndex < count) return seg;
        }
        return segments[0];
    }, [segments]);

    const spin = useCallback(() => {
        if (spinning || segments.length === 0) return;
        setSpinning(true);
        setLocalWinner(null);

        const totalSlots = segments.reduce((s, seg) => s + seg.slots, 0);
        const slotAngle = (2 * Math.PI) / totalSlots;

        const winningSlotIndex = Math.floor(Math.random() * totalSlots);
        let winningSegment = null;
        let count = 0;
        for (const seg of segments) {
            count += seg.slots;
            if (winningSlotIndex < count) { winningSegment = seg; break; }
        }

        const slotCentreAngle = (winningSlotIndex + 0.5) * slotAngle;
        const pointerAngle = (3 * Math.PI) / 2;
        const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        const targetAngle = -(slotCentreAngle - pointerAngle + extraSpins);

        spinStateRef.current = {
            angle: spinStateRef.current.angle,
            startAngle: spinStateRef.current.angle,
            targetAngle: targetAngle + spinStateRef.current.angle,
            startTime: null,
            duration: 5000 + Math.random() * 2000,
            winningSegment,
            spinning: true,
        };

        const easeOut = (t) => 1 - Math.pow(1 - t, 4);

        const animate = (timestamp) => {
            const state = spinStateRef.current;
            if (!state.startTime) state.startTime = timestamp;
            const elapsed = timestamp - state.startTime;
            const progress = Math.min(elapsed / state.duration, 1);
            const easedProgress = easeOut(progress);

            state.angle = state.startAngle + (state.targetAngle - state.startAngle) * easedProgress;
            drawWheel(state.angle);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                setLocalWinner(state.winningSegment);
                onSpinEnd(state.winningSegment);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
    }, [spinning, segments, drawWheel, onSpinEnd]);

    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    if (segments.length === 0) return null;

    return (
        <div className="spin-wheel-wrap">
            <canvas
                ref={canvasRef}
                width={420}
                height={420}
                className="spin-wheel-canvas"
            />
            {isOwner && !localWinner && (
                <button
                    className="spin-btn"
                    onClick={spin}
                    disabled={spinning}
                >
                    {spinning ? '🌀 Spinning…' : '🎰 Spin the Wheel!'}
                </button>
            )}
            {!isOwner && !localWinner && (
                <p className="spin-wheel-waiting">Waiting for the owner to spin…</p>
            )}
            {localWinner && (
                <div className="spin-winner-banner">
                    🎉 <strong>{localWinner.title}</strong> by {localWinner.author}
                </div>
            )}
        </div>
    );
}

export default function VotingPanel({ clubId, isOwner }) {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [nominatingId, setNominatingId] = useState(null);
    const [closing, setClosing] = useState(false);
    const [closeError, setCloseError] = useState('');

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/bookclubs/${clubId}/votes/current`)
            .then(r => setSession(r.data))
            .catch(() => setError('Failed to load nominations.'))
            .finally(() => setLoading(false));
    }, [clubId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSearchError('');
        setSearchResults([]);
        try {
            const res = await axios.get(`${API_URL}/books/search`, { params: { q: searchQuery } });
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
        } catch {
            setSearchError('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const handleNominate = async (book) => {
        setNominatingId(book.openLibraryId);
        setSearchError('');
        try {
            const res = await axios.post(`${API_URL}/bookclubs/${clubId}/votes/nominate`, { book });
            setSession(res.data);
            setSearchResults([]);
            setSearchQuery('');
        } catch (err) {
            setSearchError(err.response?.data?.error || 'Failed to nominate.');
        } finally {
            setNominatingId(null);
        }
    };

    const handleClose = async () => {
        setClosing(true);
        setCloseError('');
        try {
            const res = await axios.patch(`${API_URL}/bookclubs/${clubId}/votes/current/close`);
            setSession(res.data);
        } catch (err) {
            setCloseError(err.response?.data?.error || 'Failed to close nominations.');
        } finally {
            setClosing(false);
        }
    };

    const handleSpinEnd = async (winningSegment) => {
        try {
            const res = await axios.post(
                `${API_URL}/bookclubs/${clubId}/votes/current/winner`,
                { openLibraryId: winningSegment.openLibraryId }
            );
            setSession(res.data);
        } catch (err) {
            console.error('Failed to save winner:', err);
        }
    };

    const userNomCount = session?.nominations?.filter(n =>
        n.nominatedBy.some(u => (u._id || u).toString() === user?._id)
    ).length ?? 0;

    const nominatedIds = new Set(
        session?.nominations?.map(n => n.book.openLibraryId) || []
    );

    const userNominatedIds = new Set(
        session?.nominations
            ?.filter(n => n.nominatedBy.some(u => (u._id || u).toString() === user?._id))
            .map(n => n.book.openLibraryId) || []
    );

    const wheelSegments = (session?.nominations || []).map(n => ({
        openLibraryId: n.book.openLibraryId,
        title: n.book.title,
        author: n.book.author,
        cover: n.book.cover,
        slots: n.nominatedBy.length,
    }));

    const monthLabel = session?.month
        ? new Date(session.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })
        : '';

    if (loading) return (
        <div className="voting-panel__loading">
            <span className="voting-spinner" /> Loading nominations...
        </div>
    );

    if (error) return <div className="voting-panel__error">{error}</div>;

    return (
        <div className="voting-panel">

            <div className="voting-panel__header-row">
                <div>
                    <h2 className="voting-panel__heading">Monthly Book Pick</h2>
                    {monthLabel && <span className="voting-panel__month">📅 {monthLabel}</span>}
                </div>
                <div className="voting-panel__status-badge voting-panel__status-badge--${session?.status}">
                    {session?.status === 'open' && '🟢 Nominations Open'}
                    {session?.status === 'closed' && '🔴 Nominations Closed'}
                    {session?.status === 'winner_selected' && '🏆 Winner Selected'}
                </div>
            </div>

            {session?.status === 'winner_selected' && session.winner && (
                <div className="voting-panel__winner-card">
                    <div className="voting-panel__winner-label">🏆 This Month's Pick</div>
                    <div className="voting-panel__winner-inner">
                        {session.winner.cover && (
                            <img src={session.winner.cover} alt={session.winner.title} className="voting-panel__winner-cover" />
                        )}
                        <div>
                            <div className="voting-panel__winner-title">{session.winner.title}</div>
                            <div className="voting-panel__winner-author">by {session.winner.author}</div>
                        </div>
                    </div>
                </div>
            )}

            {session?.status === 'closed' && (
                <div className="voting-panel__wheel-section">
                    <h3 className="voting-panel__subheading">
                        {isOwner ? 'Spin to pick this month\'s book!' : 'Waiting for the owner to spin the wheel…'}
                    </h3>
                    <SpinWheel
                        segments={wheelSegments}
                        onSpinEnd={handleSpinEnd}
                        isOwner={isOwner}
                        winner={null}
                    />
                </div>
            )}

            <div>
                <div className="voting-panel__nom-header">
                    <h3 className="voting-panel__subheading">
                        Nominations
                        {session?.nominations?.length > 0 && (
                            <span className="voting-panel__nom-count">{session.nominations.length}</span>
                        )}
                    </h3>
                    {session?.status === 'open' && (
                        <span className="voting-panel__nom-limit">
                            Your nominations: {userNomCount} / {NOMINATION_LIMIT}
                        </span>
                    )}
                </div>

                {session?.nominations?.length === 0 ? (
                    <div className="voting-panel__empty">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <p>No nominations yet — nominate a book below!</p>
                    </div>
                ) : (
                    <div className="voting-panel__nominations">
                        {session.nominations.map(nomination => (
                            <div key={nomination._id} className="nomination-card">
                                {nomination.book.cover
                                    ? <img src={nomination.book.cover} alt={nomination.book.title} className="nomination-card__cover" />
                                    : <div className="nomination-card__cover-placeholder">📖</div>
                                }
                                <div className="nomination-card__info">
                                    <p className="nomination-card__title">{nomination.book.title}</p>
                                    <p className="nomination-card__author">{nomination.book.author}</p>
                                    <div className="nomination-card__nominators">
                                        {nomination.nominatedBy.map(u => (
                                            <span key={u._id || u} className="nomination-card__nominator-chip">
                                                {u.displayName || u.username || '?'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="nomination-card__slots">
                                    <span className="nomination-card__slots-count">{nomination.nominatedBy.length}</span>
                                    <span className="nomination-card__slots-label">
                                        {nomination.nominatedBy.length === 1 ? 'slot' : 'slots'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isOwner && session?.status === 'open' && (
                    <div className="voting-panel__close-row">
                        {closeError && <div className="voting-panel__error">{closeError}</div>}
                        <button
                            className="voting-panel__close-btn"
                            onClick={handleClose}
                            disabled={closing || session?.nominations?.length === 0}
                        >
                            {closing ? <><span className="voting-spinner voting-spinner--sm" /> Closing…</> : '🔒 Close Nominations & Spin'}
                        </button>
                    </div>
                )}
            </div>

            {session?.status === 'open' && (
                <div className="voting-panel__nominate">
                    <h3 className="voting-panel__subheading">
                        Nominate a Book
                        {userNomCount >= NOMINATION_LIMIT && (
                            <span className="voting-panel__limit-reached"> — limit reached</span>
                        )}
                    </h3>

                    <form onSubmit={handleSearch} className="voting-panel__search-row">
                        <input
                            type="text"
                            className="voting-panel__search-input"
                            placeholder="Search by title or author…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            disabled={userNomCount >= NOMINATION_LIMIT}
                        />
                        <button
                            type="submit"
                            className="voting-panel__search-btn"
                            disabled={searching || !searchQuery.trim() || userNomCount >= NOMINATION_LIMIT}
                        >
                            {searching ? <><span className="voting-spinner" /> Searching…</> : 'Search'}
                        </button>
                    </form>

                    {searchError && <div className="voting-panel__error" style={{ marginTop: 10 }}>{searchError}</div>}

                    {searchResults.length > 0 && (
                        <div className="voting-panel__results">
                            {searchResults.map(book => {
                                const alreadyNominatedByMe = userNominatedIds.has(book.openLibraryId);
                                const atLimit = userNomCount >= NOMINATION_LIMIT;
                                const disabled = alreadyNominatedByMe || atLimit || nominatingId === book.openLibraryId;
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
                                            disabled={disabled}
                                        >
                                            {alreadyNominatedByMe
                                                ? 'Nominated'
                                                : nominatingId === book.openLibraryId
                                                    ? '…'
                                                    : 'Nominate'
                                            }
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}