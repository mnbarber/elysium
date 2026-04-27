import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function ClubCard({ club }) {
    const { user } = useAuth();
    const isMember = user && club.members?.some(m =>
        (m._id || m) === user._id
    );

    return (
        <Link to={`/bookclubs/${club._id}`} className="club-card">
            <div className="club-card__spine" />

            <div className="club-card__cover">
                {club.coverImage ? (
                    <img src={club.coverImage} alt={club.name} className="club-card__cover-img" />
                ) : (
                    <div className="club-card__cover-placeholder">
                        <span className="club-card__cover-initial">{club.name.charAt(0)}</span>
                    </div>
                )}
                <div className="club-card__badges">
                    {club.isPrivate && <span className="badge badge--private">Private</span>}
                    {isMember && <span className="badge badge--member">Joined</span>}
                </div>
            </div>

            <div className="club-card__body">
                <h3 className="club-card__name">{club.name}</h3>
                {club.description && (
                    <p className="club-card__description">{club.description}</p>
                )}
                <div className="club-card__meta">
                    <span className="club-card__meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {club.members?.length ?? 0} {club.members?.length === 1 ? 'member' : 'members'}
                    </span>
                    <span className="club-card__meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {timeAgo(club.lastActivity)}
                    </span>
                </div>
                {club.owner && (
                    <div className="club-card__owner">
                        {club.owner.avatar ? (
                            <img src={club.owner.avatar} alt={club.owner.displayName} className="club-card__owner-avatar" />
                        ) : (
                            <div className="club-card__owner-avatar club-card__owner-avatar--placeholder">
                                {(club.owner.displayName || club.owner.username || '?').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span>by {club.owner.displayName || club.owner.username}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}