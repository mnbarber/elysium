import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/socketContext';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import NewMessageModal from './NewMessageModal';
import './MessagesLayout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function MessagesLayout() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (userId && conversations.length > 0) {
            const conv = conversations.find(c => c.otherUser._id === userId);
            if (conv) {
                setSelectedConversation(conv);
            } else {
                createConversation(userId);
            }
        }
    }, [userId, conversations]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive-message', (data) => {
            fetchConversations();
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/messages/conversations`);
            setConversations(response.data.conversations || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const createConversation = async (otherUserId) => {
        try {
            const response = await axios.get(`${API_URL}/messages/conversation/${otherUserId}`);

            const newConv = {
                _id: response.data.conversationId,
                otherUser: response.data.otherUser,
                lastMessage: null,
                updatedAt: new Date()
            };

            setConversations(prev => [newConv, ...prev]);
            setSelectedConversation(newConv);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        navigate(`/messages/${conversation.otherUser._id}`);
    };

    return (
        <div className="messages-layout">
            <ConversationsList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                onNewMessage={() => setShowNewMessageModal(true)}
                loading={loading}
            />

            <ChatWindow
                conversation={selectedConversation}
                onMessageSent={fetchConversations}
            />

            {showNewMessageModal && (
                <NewMessageModal onClose={() => setShowNewMessageModal(false)} />
            )}
        </div>
    );
}

export default MessagesLayout;