const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const User = require('../models/user');
const auth = require('../middleware/auth');

router.get('/profile/:username', profileController.getPublicProfile);
router.put('/profile/:username/edit', auth, profileController.updateProfile);
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ users: [] });
        }
        const searchRegex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [
                { username: searchRegex },
                { 'profile.displayName': searchRegex }
            ],
            'profile.isPublic': { $ne: false }
        })
            .select('username profile.displayName profile.avatarUrl')
            .limit(5);
        res.json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Error searching users' });
    }
});

module.exports = router;