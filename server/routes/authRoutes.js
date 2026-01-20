const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/user');
const Library = require('../models/library');
const Activity = require('../models/activity');
const Goal = require('../models/goal');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getCurrentUser);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.put('/email', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        await User.findByIdAndUpdate(req.userId, { email });
        res.json({ message: 'Email updated successfully' });
    } catch (error) {
        console.error('Error updating email:', error);
        res.status(500).json({ error: 'Error updating email' });
    }
});
router.put('/username', auth, async (req, res) => {
    try {
        const { username } = req.body;
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        await User.findByIdAndUpdate(req.userId, { username });
        res.json({ message: 'Username updated successfully' });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Error updating username' });
    }
});
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Error updating password' });
    }
});
router.put('/privacy', auth, async (req, res) => {
    try {
        const { isPublic } = req.body;
        await User.findByIdAndUpdate(req.userId, {
            'profile.isPublic': isPublic
        });
        res.json({ message: 'Privacy settings updated' });
    } catch (error) {
        console.error('Error updating privacy:', error);
        res.status(500).json({ error: 'Error updating privacy settings' });
    }
});
router.delete('/account', auth, async (req, res) => {
    try {
        await Library.deleteMany({ userId: req.userId });
        await Activity.deleteMany({ userId: req.userId });
        await Goal.deleteMany({ userId: req.userId });
        await User.findByIdAndDelete(req.userId);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Error deleting account' });
    }
});

module.exports = router;