const mongoose = require('mongoose');
const { subscribe } = require('../routes/authRoutes');

const bookSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: String,
  coverUrl: String,
  firstPublishYear: Number,
  description: String,
  numberOfPages: Number,
  isbn: String,
  subjects: [String],
  isCustom: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  review: {
    type: String,
    default: ''
  },
  containsSpoilers: {
    type: Boolean,
    default: false
  },
  reviewedAt: Date,
  readCount: {
    type: Number,
    default: 0,
    required: false
  },
  completedAt: Date,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const librarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  toRead: [bookSchema],
  currentlyReading: [bookSchema],
  read: [bookSchema],
  paused: [bookSchema],
  dnf: [bookSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Library', librarySchema);