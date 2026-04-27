const mongoose = require('mongoose');

const bookClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    coverImage: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    inviteToken: {
        type: String,
        default: () => require('crypto').randomBytes(20).toString('hex')
    },
}, { timestamps: true });

module.exports = mongoose.model('BookClub', bookClubSchema);