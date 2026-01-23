import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/socketContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ChatWindow({ conversation, onMessageSent }) {
    const { socket, onlineUsers } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        if (conversation) {
            fetchMessages();
            markAsRead();
        }
    }, [conversation]);

    useEffect(() => {
        if (!socket || !conversation) return;

        socket.on('receive-message', (data) => {
            if (data.conversationId === conversation._id) {
                setMessages(prev => [...prev, data]);
                scrollToBottom();
                markAsRead();
            }
        });

        socket.on('user-typing', (data) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(true);
            }
        });

        socket.on('user-stop-typing', (data) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(false);
            }
        });

        return () => {
            socket.off('receive-message');
            socket.off('user-typing');
            socket.off('user-stop-typing');
        };
    }, [socket, conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_URL}/messages/conversation/${conversation._id}/messages`
            );
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await axios.put(`${API_URL}/messages/conversation/${conversation._id}/read`);

            if (socket) {
                socket.emit('mark-read', {
                    conversationId: conversation._id,
                    recipientId: conversation.otherUser._id
                });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleTyping = () => {
        if (socket && conversation) {
            socket.emit('typing', {
                conversationId: conversation._id,
                recipientId: conversation.otherUser._id
            });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', {
                    conversationId: conversation._id,
                    recipientId: conversation.otherUser._id
                });
            }, 1000);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);

            const response = await axios.post(`${API_URL}/messages/send`, {
                conversationId: conversation._id,
                recipientId: conversation.otherUser._id,
                content: newMessage.trim()
            });

            setMessages(prev => [...prev, response.data.message]);
            setNewMessage('');

            if (socket) {
                socket.emit('send-message', {
                    conversationId: conversation._id,
                    recipientId: conversation.otherUser._id,
                    content: newMessage.trim()
                });

                socket.emit('stop-typing', {
                    conversationId: conversation._id,
                    recipientId: conversation.otherUser._id
                });
            }

            onMessageSent?.();
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (!conversation) {
        return (
            <div className="chat-window-empty">
                <div className="empty-state-chat">
                    <h2>💬</h2>
                    <p>Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    const isOnline = onlineUsers.has(conversation.otherUser._id);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-header-user">
                    <div className="chat-avatar-wrapper">
                        {conversation.otherUser.avatarUrl ? (
                            <img
                                src={conversation.otherUser.avatarUrl}
                                alt={conversation.otherUser.username}
                            />
                        ) : (
                            <div className="chat-avatar-placeholder">
                                {conversation.otherUser.username[0].toUpperCase()}
                            </div>
                        )}
                        {isOnline && <span className="online-dot-large"></span>}
                    </div>

                    <div className="chat-header-info">
                        <h3>{conversation.otherUser.displayName}</h3>
                        <span className="user-status">
                            {isOnline ? 'Active now' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="messages-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages-yet">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwn = message.sender._id === currentUserId || message.sender === currentUserId;
                            const showAvatar = !isOwn && (
                                index === 0 ||
                                messages[index - 1].sender._id !== message.sender._id
                            );

                            return (
                                <div
                                    key={message._id || index}
                                    className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                                >
                                    {showAvatar && !isOwn && (
                                        <div className="message-avatar-small">
                                            {conversation.otherUser.avatarUrl ? (
                                                <img
                                                    src={conversation.otherUser.avatarUrl}
                                                    alt={conversation.otherUser.username}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder-small">
                                                    {conversation.otherUser.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                                        <p>{message.content}</p>
                                        <span className="message-timestamp">{formatTime(message.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="typing-indicator-wrapper">
                                <div className="message-avatar-small">
                                    {conversation.otherUser.avatarUrl ? (
                                        <img
                                            src={conversation.otherUser.avatarUrl}
                                            alt={conversation.otherUser.username}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder-small">
                                            {conversation.otherUser.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form onSubmit={sendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder="Write a message..."
                    maxLength={2000}
                    disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}

export default ChatWindow;