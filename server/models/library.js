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
  read: [bookSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Library', librarySchema);