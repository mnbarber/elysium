const express = require('express');
const router = express.Router();
const bookListController = require('../controllers/bookListController');
const auth = require('../middleware/auth');

// list management
router.post('/lists', auth, bookListController.createList);
router.get('/lists/user', auth, bookListController.getUserLists);
router.get('/lists/public', bookListController.getPublicLists);
router.get('/lists/:listId', auth, bookListController.getListById);
router.put('/lists/:listId', auth, bookListController.updateList);
router.delete('/lists/:listId', auth, bookListController.deleteList);

// books in lists
router.post('/lists/:listId/books', auth, bookListController.addBookToList);
router.delete('/lists/:listId/books/:bookKey', auth, bookListController.removeBookFromList);

// suggestions
router.post('/lists/:listId/suggest', auth, bookListController.suggestBook);
router.post('/lists/:listId/suggestions/:suggestionId/accept', auth, bookListController.acceptSuggestion);
router.post('/lists/:listId/suggestions/:suggestionId/reject', auth, bookListController.rejectSuggestion);

module.exports = router;