const mongoose = require('mongoose');

const bookListItemSchema = new mongoose.Schema({
    key: String,
    title: String,
    author: String,
    coverUrl: String,
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const suggestionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        key: String,
        title: String,
        author: String,
        coverUrl: String
    },
    note: {
        type: String,
        maxlength: 500
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
});

const bookListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    books: [bookListItemSchema],
    suggestions: [suggestionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BookList', bookListSchema);