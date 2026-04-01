const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema({
    book: {
        openLibraryId: String,
        title: String,
        author: String,
        cover: String,
        year: String,
    },
    nominatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
});

const voteSessionSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookClub',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    nominations: [nominationSchema],
    isOpen: {
        type: Boolean,
        default: true
    },
    winner: {
        openLibraryId: String,
        title: String,
        author: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('VoteSession', voteSessionSchema);