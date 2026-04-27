const express = require('express');
const router = express.Router();
const BookClub = require('../models/bookClub');
const VoteSession = require('../models/vote');
const ClubPost = require('../models/clubPost');
const auth = require('../middleware/auth');

const NOMINATION_LIMIT = 3;

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
        const isOwner = club.owner._id.toString() === req.userId;
        if (club.isPrivate && !isMember) {
            return res.status(403).json({ error: 'This club is private.' });
        }
        // owner can invite
        const clubObj = club.toObject();
        if (!isOwner) delete clubObj.inviteToken;
        res.json(clubObj);
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
        if (coverImage !== undefined) club.coverImage = coverImage;
        await club.save();
        res.json(club);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update club' });
    }
});

// DELETE /api/bookclubs/:id — owner only
router.delete('/:id', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can delete this.' });
        }
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
            return res.status(400).json({ error: 'The owner cannot leave. Transfer ownership or delete the club.' });
        }
        club.members = club.members.filter(m => m.toString() !== req.userId);
        await club.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave club' });
    }
});

// GET /api/bookclubs/invite/:token — get club info by invite token
router.get('/invite/:token', auth, async (req, res) => {
    try {
        const club = await BookClub.findOne({ inviteToken: req.params.token })
            .populate('owner', 'username displayName avatar')
            .populate('members', '_id');
        if (!club) return res.status(404).json({ error: 'Invalid or expired invite link, please speak to club owner to request a new one!' });
        const { inviteToken, ...safe } = club.toObject();
        res.json(safe);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch club by invite token' });
    }
});

// POST /api/bookclubs/invite/:token/join — join club via invite token
router.post('/invite/:token/join', auth, async (req, res) => {
    try {
        const club = await BookClub.findOne({ inviteToken: req.params.token });
        if (!club) return res.status(404).json({ error: 'Invalid or expired invite link, please speak to club owner to request a new one!' });
        const alreadyMember = club.members.some(m => m.toString() === req.userId);
        if (!alreadyMember) {
            club.members.push(req.userId);
            club.lastActivity = new Date();
            await club.save();
        }
        res.json({ clubId: club._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join club by invite token' });
    }
});

// POST /api/bookclubs/:id/invite/regenerate — owner regenerates invite token
router.post('/:id/invite/regenerate', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can regenerate the invite link.' });
        }
        const crypto = require('crypto');
        club.inviteToken = crypto.randomBytes(20).toString('hex');
        await club.save();
        res.json({ inviteToken: club.inviteToken });
    } catch (err) {
        res.status(500).json({ error: 'Failed to regenerate invite token' });
    }
});

// GET /api/bookclubs/:id/votes/current
router.get('/:id/votes/current', auth, async (req, res) => {
    try {
        const month = new Date().toISOString().slice(0, 7);
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
        const { book } = req.body;
        if (!book?.openLibraryId || !book?.title) {
            return res.status(400).json({ error: 'Book data is required.' });
        }

        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        const isMember = club.members.some(m => m.toString() === req.userId);
        if (!isMember) return res.status(403).json({ error: 'You must be a member to nominate.' });

        let session = await VoteSession.findOne({ club: req.params.id, month });
        if (!session) {
            session = await VoteSession.create({ club: req.params.id, month, nominations: [] });
        }

        if (session.status !== 'open') {
            return res.status(400).json({ error: 'Nominations are closed for this month.' });
        }

        const userNomCount = session.nominations.filter(n =>
            n.nominatedBy.some(uid => uid.toString() === req.userId)
        ).length;
        if (userNomCount >= NOMINATION_LIMIT) {
            return res.status(400).json({ error: `You can only nominate ${NOMINATION_LIMIT} books per month.` });
        }

        const existingNomination = session.nominations.find(n =>
            n.book.openLibraryId === book.openLibraryId
        );
        if (existingNomination) {
            const alreadyNominatedByUser = existingNomination.nominatedBy.some(
                uid => uid.toString() === req.userId
            );
            if (alreadyNominatedByUser) {
                return res.status(400).json({ error: 'You already nominated this book.' });
            }
            existingNomination.nominatedBy.push(req.userId);
        } else {
            session.nominations.push({ book, nominatedBy: [req.userId] });
        }

        await session.save();
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });
        await session.populate('nominations.nominatedBy', 'username displayName avatar');
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to nominate book' });
    }
});

// PATCH /api/bookclubs/:id/votes/current/close — owner closes nominations
router.patch('/:id/votes/current/close', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can close nominations.' });
        }

        const month = new Date().toISOString().slice(0, 7);
        const session = await VoteSession.findOne({ club: req.params.id, month });
        if (!session) return res.status(404).json({ error: 'No active session found.' });
        if (session.nominations.length === 0) {
            return res.status(400).json({ error: 'Cannot close nominations — no books have been nominated yet.' });
        }

        session.status = 'closed';
        await session.save();
        await session.populate('nominations.nominatedBy', 'username displayName avatar');
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to close nominations' });
    }
});

// POST /api/bookclubs/:id/votes/current/winner — owner saves the spin result
router.post('/:id/votes/current/winner', auth, async (req, res) => {
    try {
        const club = await BookClub.findById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        if (club.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Only the club owner can confirm the winner.' });
        }

        const { openLibraryId } = req.body;
        if (!openLibraryId) return res.status(400).json({ error: 'Winner book ID is required.' });

        const month = new Date().toISOString().slice(0, 7);
        const session = await VoteSession.findOne({ club: req.params.id, month });
        if (!session) return res.status(404).json({ error: 'No active session found.' });
        if (session.status !== 'closed') {
            return res.status(400).json({ error: 'Nominations must be closed before selecting a winner.' });
        }

        const winningNomination = session.nominations.find(n =>
            n.book.openLibraryId === openLibraryId
        );
        if (!winningNomination) return res.status(404).json({ error: 'Winning book not found in nominations.' });

        session.winner = winningNomination.book;
        session.status = 'winner_selected';
        await session.save();
        await BookClub.findByIdAndUpdate(req.params.id, { lastActivity: new Date() });
        await session.populate('nominations.nominatedBy', 'username displayName avatar');
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save winner' });
    }
});

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