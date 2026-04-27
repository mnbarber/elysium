const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema({
    book: {
        openLibraryId: String,
        title: String,
        author: String,
        cover: String,
        year: String,
    },
    nominatedBy: [{
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
    status: {
        type: String,
        enum: ['open', 'closed', 'winner_selected'],
        default: 'open'
    },
    winner: {
        openLibraryId: String,
        title: String,
        author: String,
        cover: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('VoteSession', voteSessionSchema);