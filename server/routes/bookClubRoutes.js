const express = require('express');
const router = express.Router();
const BookClub = require('../models/bookClub');
const VoteSession = require('../models/vote');
const ClubPost = require('../models/clubPost');
const auth = require('../middleware/auth');

// GET /api/bookclubs — all public clubs, sorted by lastActivity
router.get('/', async (req, res) => {
    try {
        const clubs = await BookClub.find({ isPrivate: false })
            .sort({ lastActivity: -1 })
            .populate('owner', 'username displayName avatar')
            .populate('members', '_id')
            .lean();
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch book clubs' });
    }
});

// POST /api/bookclubs — create a club
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, isPrivate, coverImage } = req.body;
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ error: 'Club name must be at least 3 characters.' });
        }
        const club = await BookClub.create({
            name: name.trim(),
            description: description?.trim(),
            isPrivate: !!isPrivate,
            coverImage: coverImage?.trim() || undefined,
            owner: req.userId,
            members: [req.userId],
        });

        console.log(`Created book club: ${club.name} (ID: ${club._id}) by user ${req.userId}`);

        const populated = await club.populate('owner', 'username displayName avatar');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create book club' });
    }
});

// GET /api/bookclubs/:id — single club
router.get('/:id', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id)
            .populate('members', 'username displayName avatar')
            .populate('owner', 'username displayName avatar');
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m._id.toString() === req.userId);
        if (club.isPrivate && !isMember) {
            return res.status(403).json({ error: 'This club is private.' });
        }
        res.json(club);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch club' });
    }
});

// PATCH /api/bookclubs/:id — update club (owner only)
router.patch('/:id', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can edit this.' });
        }
        const { name, description, isPrivate, coverImage } = req.body;
        if (name !== undefined) club.name = name.trim();
        if (description !== undefined) club.description = description.trim();
        if (isPrivate !== undefined) club.isPrivate = !!isPrivate;
        if (coverImage !== undefined) club.coverImage = coverImage.trim() || undefined;
        await club.save();
        res.json(club);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update club' });
    }
});

// DELETE /api/bookclubs/:id — delete club (owner only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can delete this.' });
        }

        // delete the club and all associated data
        await Promise.all([
            BookClub.findByIdAndDelete(req.params.id),
            VoteSession.deleteMany({ club: req.params.id }),
            ClubPost.deleteMany({ club: req.params.id }),
        ]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete club' });
    }
});

// POST /api/bookclubs/:id/join
router.post('/:id/join', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.isPrivate) return res.status(403).json({ error: 'This club is private — invite only.' });
        const alreadyMember = club.members.some(m => m.toString() === req.userId);
        if (!alreadyMember) {
            club.members.push(req.userId);
            club.lastActivity = new Date();
            await club.save();
        }
        const populated = await club.populate('members', 'username displayName avatar');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to join club' });
    }
});

// POST /api/bookclubs/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() === req.userId) {
            return res.status(400).json({ error: 'The club owner cannot leave. Transfer ownership or delete the club.' });
        }
        club.members = club.members.filter(m => m.toString() !== req.userId);
        await club.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave club' });
    }
});

// ── Voting ─────────────────────────────────────────────────────────────────────

// GET /api/bookclubs/:id/votes/current
router.get('/:id/votes/current', auth, async (req, res) => {
    try {
        const month = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
        let session = await VoteSession.findOne({ club: req.params.id, month })
            .populate('nominations.nominatedBy', 'username displayName avatar');
        if (!session) {
            session = await VoteSession.create({ club: req.params.id, month, nominations: [] });
        }
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vote session' });
    }
});

// POST /api/bookclubs/:id/votes/nominate
router.post('/:id/votes/nominate', auth, async (req, res) => {
    try {
        const month = new Date().toISOString().slice(0, 7);
        const { book } = req.body; // { openLibraryId, title, author, coverUrl, firstPublishYear }
        if (!book?.openLibraryId || !book?.title) {
            return res.status(400).json({ error: 'Book data is required.' });
        }
        // Verify requester is a member
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m.toString() === req.userId);
        if (!isMember) return res.status(403).json({ error: 'You must be a member to nominate.' });

        let session = await VoteSession.findOne({ club: req.params.id, month });
        if (!session) {
            session = await VoteSession.create({ club: req.params.id, month, nominations: [] });
        }
        if (!session.isOpen) return res.status(400).json({ error: 'Voting is closed for this month.' });
        const alreadyNominated = session.nominations.some(n => n.book.openLibraryId === book.openLibraryId);
        if (alreadyNominated) return res.status(400).json({ error: 'This book has already been nominated.' });

        session.nominations.push({ book, nominatedBy: req.userId, votes: [] });
        await session.save();
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });

        await session.populate('nominations.nominatedBy', 'username displayName avatar');
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to nominate book' });
    }
});

// POST /api/bookclubs/:id/votes/:nominationId/vote
router.post('/:id/votes/:nominationId/vote', auth, async (req, res) => {
    try {
        const month = new Date().toISOString().slice(0, 7);
        const session = await VoteSession.findOne({ club: req.params.id, month });
        if (!session) return res.status(404).json({ error: 'No active vote session.' });
        if (!session.isOpen) return res.status(400).json({ error: 'Voting is closed.' });

        // Remove existing vote from all nominations (one vote per user)
        session.nominations.forEach(n => {
            n.votes = n.votes.filter(v => v.toString() !== req.userId);
        });
        const nomination = session.nominations.id(req.params.nominationId);
        if (!nomination) return res.status(404).json({ error: 'Nomination not found.' });
        nomination.votes.push(req.userId);
        await session.save();
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });

        await session.populate('nominations.nominatedBy', 'username displayName avatar');
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to cast vote' });
    }
});

// ── Discussion Posts ───────────────────────────────────────────────────────────

// GET /api/bookclubs/:id/posts
router.get('/:id/posts', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m.toString() === req.userId);
        if (club.isPrivate && !isMember) return res.status(403).json({ error: 'Private club.' });

        const posts = await ClubPost.find({ club: req.params.id })
            .sort({ createdAt: -1 })
            .populate('author', 'username displayName avatar')
            .populate('replies.author', 'username displayName avatar');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// POST /api/bookclubs/:id/posts
router.post('/:id/posts', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });
        if (!content?.trim()) return res.status(400).json({ error: 'Content is required.' });

        // Verify membership
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m.toString() === req.userId);
        if (!isMember) return res.status(403).json({ error: 'You must be a member to post.' });

        const post = await ClubPost.create({
            club: req.params.id,
            author: req.userId,
            title: title.trim(),
            content: content.trim(),
        });
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });
        const populated = await post.populate('author', 'username displayName avatar');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// POST /api/bookclubs/:id/posts/:postId/reply
router.post('/:id/posts/:postId/reply', auth, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ error: 'Reply content is required.' });

        // Verify membership
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m.toString() === req.userId);
        if (!isMember) return res.status(403).json({ error: 'You must be a member to reply.' });

        const post = await ClubPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found.' });

        post.replies.push({ author: req.userId, content: content.trim() });
        await post.save();
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });

        await post.populate('author', 'username displayName avatar');
        await post.populate('replies.author', 'username displayName avatar');
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to post reply' });
    }
});

module.exports = router;