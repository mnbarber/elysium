import { useEffect, useState } from 'react';
import axios from 'axios';
import ClubCard from './ClubCard';
import { Link } from 'react-router-dom';
import './BookClubsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function BookClubsPage() {
    const [clubs, setClubs] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/bookclubs`).then(r => setClubs(r.data));
    }, []);

    return (
        <div className="book-clubs-page">
            <div className="page-header">
                <h1>Book Clubs</h1>
                <Link to="/bookclubs/create" className="btn-primary">Start a Club</Link>
            </div>
            <div className="clubs-grid">
                {clubs.map(club => <ClubCard key={club._id} club={club} />)}
            </div>
        </div>
    );
}