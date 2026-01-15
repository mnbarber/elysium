import React from 'react';
import { Link } from 'react-router-dom';

function ActivityText({ activity }) {
    const username = activity.user?.username || 'Someone';
    const bookTitle = activity.book?.title || 'a book';
    const bookKey = activity.book?.key;

    switch (activity.activityType) {
        case 'added_book':
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' added '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                    {` to ${activity.libraryName}`}
                </>
            );

        case 'rated_book':
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' rated '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                    {` ${activity.rating} stars`}
                </>
            );

        case 'moved_book':
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' moved '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                    {` to ${activity.toLibrary}`}
                </>
            );

        case 'finished_book':
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' finished reading '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                </>
            );

        case 'reviewed_book':
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' reviewed '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                </>
            );

        default:
            return (
                <>
                    <Link to={`/profile/${username}`} className="username-link">
                        {username}
                    </Link>
                    {' did something with '}
                    <Link to={`/book${bookKey}`} className="book-link">
                        {bookTitle}
                    </Link>
                </>
            );
    }
}

export default ActivityText;