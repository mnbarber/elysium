const mongoose = require('mongoose');

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
    required: true
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