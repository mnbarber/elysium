const User = require('../models/user');
const Library = require('../models/library');

// get own profile
const getOwnProfile = async (req, res) => {
    console.log('=== getOwnProfile called ===');
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        console.log('User found:', user ? user.username : 'null');
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
    console.log('=== updateProfile called ===');
    try {
        const { displayName, bio, avatarUrl, isPublic } = req.body;
        console.log('Update data received:', req.body);

        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        console.log('Current profile data:', user.profile);

        user.profile.displayName = displayName || user.profile.displayName;
        user.profile.bio = bio || user.profile.bio;
        user.profile.avatarUrl = avatarUrl || user.profile.avatarUrl;
        if (typeof isPublic === 'boolean') {
            user.profile.isPublic = isPublic;
        }

        console.log('Updated profile data:', user.profile);

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

// get public profile by username
const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username })
            .select('username profile');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPublic = user.profile?.isPublic !== false;
        const currentUserId = req.userId;

        if (!isPublic && currentUserId) {
            const areFriends = await Friendship.exists({
                $or: [
                    { user1: currentUserId, user2: user._id, status: 'accepted' },
                    { user1: user._id, user2: currentUserId, status: 'accepted' }
                ]
            });

            if (!areFriends && currentUserId !== user._id.toString()) {
                return res.status(403).json({ error: 'This profile is private' });
            }
        }

        const library = await Library.findOne({ userId: user._id });

        const stats = {
            toReadCount: library?.toRead?.length || 0,
            currentlyReadingCount: library?.currentlyReading?.length || 0,
            readCount: library?.read?.length || 0,
            pausedCount: library?.paused?.length || 0,
            dnfCount: library?.dnf?.length || 0
        };

        res.json({
            profile: {
                username: user.username,
                displayName: user.profile?.displayName || user.username,
                bio: user.profile?.bio || '',
                avatarUrl: user.profile?.avatarUrl || '',
                isPublic: user.profile?.isPublic !== false,
                userId: user._id
            },
            stats,
            libraries: {
                'to-read': library?.toRead || [],
                'currently-reading': library?.currentlyReading || [],
                'read': library?.read || [],
                'paused': library?.paused || [],
                'dnf': library?.dnf || []
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
};

module.exports = {
  getOwnProfile,
  updateProfile,
  searchUsers,
  getPublicProfile,
};