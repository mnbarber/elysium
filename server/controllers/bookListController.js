const BookList = require('../models/bookList');
const User = require('../models/user');

// create a new list
const createList = async (req, res) => {
    try {
        const { title, description, isPublic } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const bookList = new BookList({
            userId: req.userId,
            title: title.trim(),
            description: description?.trim() || '',
            isPublic: isPublic || false,
            books: [],
            suggestions: []
        });

        await bookList.save();

        res.status(201).json({
            message: 'List created successfully',
            list: bookList
        });
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ error: 'Error creating list' });
    }
};

// get user's lists
const getUserLists = async (req, res) => {
    try {
        const lists = await BookList.find({ userId: req.userId })
            .sort({ updatedAt: -1 });

        res.json({ lists });
    } catch (error) {
        console.error('Error fetching user lists:', error);
        res.status(500).json({ error: 'Error fetching lists' });
    }
};

// get a specific list
const getListById = async (req, res) => {
    try {
        const { listId } = req.params;

        const list = await BookList.findById(listId)
            .populate('userId', 'username profile.displayName profile.avatarUrl')
            .populate('suggestions.userId', 'username profile.displayName profile.avatarUrl');

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        // check if list is private
        const isOwner = list.userId._id.toString() === req.userId;
        if (!list.isPublic && !isOwner) {
            return res.status(403).json({ error: 'This list is private' });
        }

        res.json({
            list,
            isOwner
        });
    } catch (error) {
        console.error('Error fetching list:', error);
        res.status(500).json({ error: 'Error fetching list' });
    }
};

// get all public lists
const getPublicLists = async (req, res) => {
    try {
        const { search } = req.query;

        let query = { isPublic: true };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const lists = await BookList.find(query)
            .populate('userId', 'username profile.displayName profile.avatarUrl')
            .sort({ updatedAt: -1 })
            .limit(50);

        res.json({ lists });
    } catch (error) {
        console.error('Error fetching public lists:', error);
        res.status(500).json({ error: 'Error fetching public lists' });
    }
};

// update list details
const updateList = async (req, res) => {
    try {
        const { listId } = req.params;
        const { title, description, isPublic } = req.body;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to update this list' });
        }

        if (title) list.title = title.trim();
        if (description !== undefined) list.description = description.trim();
        if (isPublic !== undefined) list.isPublic = isPublic;
        list.updatedAt = new Date();

        await list.save();

        res.json({
            message: 'List updated successfully',
            list
        });
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ error: 'Error updating list' });
    }
};

// delete a list
const deleteList = async (req, res) => {
    try {
        const { listId } = req.params;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this list' });
        }

        await BookList.findByIdAndDelete(listId);

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ error: 'Error deleting list' });
    }
};

// add a book to a list
const addBookToList = async (req, res) => {
    try {
        const { listId } = req.params;
        const { book } = req.body;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to modify this list' });
        }

        const exists = list.books.some(b => b.key === book.key);
        if (exists) {
            return res.status(400).json({ error: 'Book already in this list' });
        }

        list.books.push({
            key: book.key,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl
        });
        list.updatedAt = new Date();

        await list.save();

        res.json({
            message: 'Book added to list',
            list
        });
    } catch (error) {
        console.error('Error adding book to list:', error);
        res.status(500).json({ error: 'Error adding book to list' });
    }
};

// remove a book from a list
const removeBookFromList = async (req, res) => {
    try {
        const { listId, bookKey } = req.params;
        const decodedKey = decodeURIComponent(bookKey);

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to modify this list' });
        }

        list.books = list.books.filter(b => b.key !== decodedKey);
        list.updatedAt = new Date();

        await list.save();

        res.json({
            message: 'Book removed from list',
            list
        });
    } catch (error) {
        console.error('Error removing book from list:', error);
        res.status(500).json({ error: 'Error removing book from list' });
    }
};

// suggest a book for someone else's list
const suggestBook = async (req, res) => {
    try {
        const { listId } = req.params;
        const { book, note } = req.body;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (!list.isPublic) {
            return res.status(403).json({ error: 'Cannot suggest books for private lists' });
        }

        if (list.userId.toString() === req.userId) {
            return res.status(400).json({ error: 'Cannot suggest books to your own list' });
        }

        const inList = list.books.some(b => b.key === book.key);
        if (inList) {
            return res.status(400).json({ error: 'Book is already in this list' });
        }

        const alreadySuggested = list.suggestions.some(
            s => s.book.key === book.key && s.userId.toString() === req.userId
        );
        if (alreadySuggested) {
            return res.status(400).json({ error: 'You have already suggested this book' });
        }

        list.suggestions.push({
            userId: req.userId,
            book: {
                key: book.key,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl
            },
            note: note?.trim() || '',
            status: 'pending'
        });

        await list.save();

        res.json({
            message: 'Book suggested successfully',
            list
        });
    } catch (error) {
        console.error('Error suggesting book:', error);
        res.status(500).json({ error: 'Error suggesting book' });
    }
};

// accept a suggestion on your list
const acceptSuggestion = async (req, res) => {
    try {
        const { listId, suggestionId } = req.params;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const suggestion = list.suggestions.id(suggestionId);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }

        if (suggestion.status !== 'pending') {
            return res.status(400).json({ error: 'Suggestion already processed' });
        }

        list.books.push({
            key: suggestion.book.key,
            title: suggestion.book.title,
            author: suggestion.book.author,
            coverUrl: suggestion.book.coverUrl
        });

        suggestion.status = 'accepted';
        list.updatedAt = new Date();

        await list.save();

        res.json({
            message: 'Suggestion accepted',
            list
        });
    } catch (error) {
        console.error('Error accepting suggestion:', error);
        res.status(500).json({ error: 'Error accepting suggestion' });
    }
};

// reject a suggested book
const rejectSuggestion = async (req, res) => {
    try {
        const { listId, suggestionId } = req.params;

        const list = await BookList.findById(listId);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        if (list.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const suggestion = list.suggestions.id(suggestionId);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }

        if (suggestion.status !== 'pending') {
            return res.status(400).json({ error: 'Suggestion already processed' });
        }

        suggestion.status = 'rejected';
        await list.save();

        res.json({
            message: 'Suggestion rejected',
            list
        });
    } catch (error) {
        console.error('Error rejecting suggestion:', error);
        res.status(500).json({ error: 'Error rejecting suggestion' });
    }
};

module.exports = {
    createList,
    getUserLists,
    getListById,
    getPublicLists,
    updateList,
    deleteList,
    addBookToList,
    removeBookFromList,
    suggestBook,
    acceptSuggestion,
    rejectSuggestion
};