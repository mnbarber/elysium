const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const auth = require('../middleware/auth');

// Book search and browse
router.get('/books/search', libraryController.searchBooks);
router.get('/books/browse/:genre', libraryController.browseByGenre);
router.get('/books/details/:type/:id', libraryController.getBookDetails);
router.post('/books/custom', auth, libraryController.addCustomBook);

// Library management
router.get('/libraries', auth, libraryController.getLibraries);
router.post('/libraries/move', auth, libraryController.moveBook);
router.post('/libraries/:libraryName', auth, libraryController.addBookToLibrary);
router.delete('/libraries/:libraryName/:bookKey', auth, libraryController.removeBookFromLibrary);

// Ratings
router.post('/books/rate', auth, libraryController.rateBook);
router.put('/books/rate/:bookKey', auth, libraryController.updateRating);

// Reviews
router.post('/books/review', auth, libraryController.reviewBook);
router.get('/books/review/:bookKey', auth, libraryController.getReview);
router.delete('/books/review/:bookKey', auth, libraryController.deleteReview);

// Stats and dates
router.put('/books/completion-date/:bookKey', auth, libraryController.updateCompletionDate);
router.get('/stats/reading', auth, libraryController.getReadingStats);

module.exports = router;