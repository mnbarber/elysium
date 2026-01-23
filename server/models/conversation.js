const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

conversationSchema.path('participants').validate(function(value) {
  return value.length === 2;
}, 'Conversation must have exactly 2 participants');

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);