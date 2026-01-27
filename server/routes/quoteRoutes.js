const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Quote = require('../models/quote');
const User = require('../models/user');

// get random approved quote
router.get('/random', async (req, res) => {
    try {
        const count = await Quote.countDocuments({ status: 'approved' });

        if (count === 0) {
            return res.json({
                text: "'One must always be careful of books,' said Tessa, 'and what is inside them, for words have the power to change us.'",
                author: "Cassandra Clare",
                source: "Clockwork Angel"
            });
        }

        const random = Math.floor(Math.random() * count);
        const quote = await Quote.findOne({ status: 'approved' }).skip(random);

        res.json(quote);
    } catch (error) {
        console.error('Error fetching random quote:', error);
        res.status(500).json({ error: 'Error fetching quote' });
    }
});

// submit a new quote
router.post('/submit', auth, async (req, res) => {
    try {
        const { text, author, source } = req.body;

        if (!text || !author || !source) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (text.length > 500) {
            return res.status(400).json({ error: 'Quote must be 500 characters or less' });
        }

        const quote = new Quote({
            text,
            author,
            source,
            submittedBy: req.userId,
            status: 'pending'
        });

        await quote.save();

        res.status(201).json({
            message: 'Quote submitted successfully! It will appear after approval.',
            quote
        });
    } catch (error) {
        console.error('Error submitting quote:', error);
        res.status(500).json({ error: 'Error submitting quote' });
    }
});

// get user's submitted quotes
router.get('/my-submissions', auth, async (req, res) => {
    try {
        const quotes = await Quote.find({ submittedBy: req.userId })
            .sort({ createdAt: -1 });

        res.json({ quotes });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

// admin: get all pending quotes
router.get('/pending', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const quotes = await Quote.find({ status: 'pending' })
            .populate('submittedBy', 'username')
            .sort({ createdAt: -1 });

        res.json({ quotes });
    } catch (error) {
        console.error('Error fetching pending quotes:', error);
        res.status(500).json({ error: 'Error fetching pending quotes' });
    }
});

// admin: approve quote
router.put('/:id/approve', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        );

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ message: 'Quote approved', quote });
    } catch (error) {
        console.error('Error approving quote:', error);
        res.status(500).json({ error: 'Error approving quote' });
    }
});

// admin: reject quote
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ message: 'Quote rejected', quote });
    } catch (error) {
        console.error('Error rejecting quote:', error);
        res.status(500).json({ error: 'Error rejecting quote' });
    }
});

// admin: delete quote
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Quote.findByIdAndDelete(req.params.id);

        res.json({ message: 'Quote deleted' });
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({ error: 'Error deleting quote' });
    }
});

module.exports = router;