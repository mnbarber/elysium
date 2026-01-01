const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// prevent duplicate friend requests
FriendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

module.exports = mongoose.model('Friend', FriendSchema);