const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// book search and browse
router.get('/books/search', libraryController.searchBooks);
router.get('/books/browse/:genre', libraryController.browseByGenre);
router.get('/books/details', libraryController.getBookDetails);
router.post('/books/custom', auth, libraryController.addCustomBook);
router.put('/books/progress/:bookKey', auth, libraryController.updatePageProgress);
router.get('/books/library-status/:bookKey', auth, libraryController.getBookLibraryStatus);
router.put('/books/edit/:bookKey', auth, libraryController.editBookInLibrary);

// library management
router.get('/libraries', auth, libraryController.getLibraries);
router.post('/libraries/move', auth, libraryController.moveBook);
router.post('/libraries/:libraryName', auth, libraryController.addBookToLibrary);
router.delete('/libraries/:libraryName/:bookKey', auth, libraryController.removeBookFromLibrary);

// ratings
router.post('/books/rate', auth, libraryController.rateBook);
router.put('/books/rate/:bookKey', auth, libraryController.updateRating);

// reviews
router.post('/books/review', auth, libraryController.reviewBook);
router.get('/books/review/:bookKey', auth, libraryController.getReview);
router.get('/books/reviews/:bookKey', optionalAuth, libraryController.getBookReviews);
router.delete('/books/review/:bookKey', auth, libraryController.deleteReview);
router.post('/books/reviews/:bookKey/like', auth, libraryController.toggleReviewLike);

// stats and dates
router.put('/books/completion-date/:bookKey', auth, libraryController.updateCompletionDate);
router.get('/stats/reading', auth, libraryController.getReadingStats);

module.exports = router;