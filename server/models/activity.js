const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: ['added_book', 'rated_book', 'moved_book', 'finished_book', 'reviewed_book'],
        required: true
    },
    book: {
        key: String,
        title: String,
        author: String,
        coverUrl: String,
        readCount: Number
    },
    libraryName: String,
    rating: Number,
    review: String,
    fromLibrary: String,
    toLibrary: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);