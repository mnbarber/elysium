const User = require('../models/user');
const Library = require('../models/library');

// get public profile by username
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.profile.isPublic) {
            return res.status(403).json({ error: 'This profile is private.' });
        }
        
        const library = await Library.findOne({ userId: user._id });

        res.json({
            profile: user.getPublicProfile(),
            stats: {
                toReadCount: library?.toRead.length || 0,
                currentlyReadingCount: library?.currentlyReading.length || 0,
                readCount: library?.read.length || 0,
                pausedCount: library?.paused.length || 0,
                dnfCount: library?.dnf.length || 0
            },
            libraries: user.profile.isPublic ? {
                'to-read': library?.toRead || [],
                'currently-reading': library?.currentlyReading || [],
                'read': library?.read || [],
                'paused': library?.paused || [],
                'dnf': library?.dnf || []
            } : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching public profile.' });
    }
};

// get own profile
const getOwnProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            username: user.username,
            email: user.email,
            profile: user.profile,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching profile.' });
    }
};

// update profile
const updateProfile = async (req, res) => {
    try {
        const { displayName, bio, avatarUrl, isPublic } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        user.profile.displayName = displayName || user.profile.displayName;
        user.profile.bio = bio || user.profile.bio;
        user.profile.avatarUrl = avatarUrl || user.profile.avatarUrl;
        if (typeof isPublic === 'boolean') {
            user.profile.isPublic = isPublic;
        }

        await user.save();

        res.json({ message: 'Profile updated successfully.', profile: user.profile });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating profile.' });
    }
};

// search users
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            'profile.isPublic': true
        })
        .select('username profile.displayName profile.avatarUrl')
        .limit(10);

        res.json({
            users: users.map(user => ({
                username: user.username,
                displayName: user.profile.displayName || user.username,
                avatarUrl: user.profile.avatarUrl
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error searching users.' });
    }
};

module.exports = {
  getPublicProfile,
  getOwnProfile,
  updateProfile,
  searchUsers
};