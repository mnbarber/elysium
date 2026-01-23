const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const User = require('../models/user');

// get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId
        })
            .populate('participants', 'username profile.displayName profile.avatarUrl')
            .populate('lastMessage.sender', 'username')
            .sort({ updatedAt: -1 });

        const formattedConversations = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== req.userId);

            return {
                _id: conv._id,
                otherUser: {
                    _id: otherUser._id,
                    username: otherUser.username,
                    displayName: otherUser.profile?.displayName || otherUser.username,
                    avatarUrl: otherUser.profile?.avatarUrl
                },
                lastMessage: conv.lastMessage,
                updatedAt: conv.updatedAt
            };
        });

        res.json({ conversations: formattedConversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
});

// get or create conversation with another user
router.get('/conversation/:userId', auth, async (req, res) => {
    try {
        const otherUserId = req.params.userId;

        const otherUser = await User.findById(otherUserId)
            .select('username profile.displayName profile.avatarUrl');

        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [req.userId, otherUserId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.userId, otherUserId]
            });
            await conversation.save();
        }

        res.json({
            conversationId: conversation._id,
            otherUser: {
                _id: otherUser._id,
                username: otherUser.username,
                displayName: otherUser.profile?.displayName || otherUser.username,
                avatarUrl: otherUser.profile?.avatarUrl
            }
        });
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Error getting conversation' });
    }
});

// get messages for a conversation
router.get('/conversation/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(req.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let query = { conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'username profile.displayName profile.avatarUrl');

        messages.reverse();

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// send a message
router.post('/send', auth, async (req, res) => {
    try {
        const { conversationId, recipientId, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(req.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const message = new Message({
            conversationId,
            sender: req.userId,
            recipient: recipientId,
            content: content.trim()
        });

        await message.save();

        conversation.lastMessage = {
            content: content.trim(),
            sender: req.userId,
            createdAt: message.createdAt
        };
        conversation.updatedAt = new Date();
        await conversation.save();

        await message.populate('sender', 'username profile.displayName profile.avatarUrl');

        res.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// mark messages as read
router.put('/conversation/:conversationId/read', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(req.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Message.updateMany(
            {
                conversationId,
                recipient: req.userId,
                read: false
            },
            {
                read: true
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error marking messages as read' });
    }
});

// get unread message count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            recipient: req.userId,
            read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Error fetching unread count' });
    }
});

module.exports = router;