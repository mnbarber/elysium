import React from 'react';
import { useSocket } from '../../context/socketContext';

function ConversationsList({ conversations, selectedConversation, onSelectConversation, loading }) {
    const { onlineUsers } = useSocket();

    const formatTime = (date) => {
        if (!date) return '';

        const now = new Date();
        const messageDate = new Date(date);
        const diffMs = now - messageDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="conversations-sidebar">
                <div className="conversations-header">
                    <h2>Messages</h2>
                </div>
                <div className="conversations-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="conversations-sidebar">
            <div className="conversations-header">
                <h2>Messages</h2>
            </div>

            {conversations.length === 0 ? (
                <div className="conversations-empty">
                    <p>No conversations yet</p>
                    <p className="empty-subtitle">Visit a friend's profile to start chatting!</p>
                </div>
            ) : (
                <div className="conversations-list">
                    {conversations.map(conversation => {
                        const isSelected = selectedConversation?._id === conversation._id;
                        const isOnline = onlineUsers.has(conversation.otherUser._id);

                        return (
                            <div
                                key={conversation._id}
                                className={`conversation-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onSelectConversation(conversation)}
                            >
                                <div className="conversation-avatar-wrapper">
                                    {conversation.otherUser.avatarUrl ? (
                                        <img
                                            src={conversation.otherUser.avatarUrl}
                                            alt={conversation.otherUser.username}
                                            className="conversation-avatar"
                                        />
                                    ) : (
                                        <div className="conversation-avatar-placeholder">
                                            {conversation.otherUser.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    {isOnline && <span className="online-dot"></span>}
                                </div>

                                <div className="conversation-details">
                                    <div className="conversation-top">
                                        <span className="conversation-name">
                                            {conversation.otherUser.displayName}
                                        </span>
                                        {conversation.lastMessage && (
                                            <span className="conversation-time">
                                                {formatTime(conversation.updatedAt)}
                                            </span>
                                        )}
                                    </div>

                                    {conversation.lastMessage && (
                                        <p className="conversation-preview">
                                            {conversation.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ConversationsList;