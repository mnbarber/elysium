const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadProfilePicture, uploadBookCover } = require('../utils/s3Upload');

router.post('/profile-picture', auth, uploadProfilePicture.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            message: 'Profile picture uploaded successfully',
            imageUrl: req.file.location
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

router.post('/book-cover', auth, uploadBookCover.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            message: 'Book cover uploaded successfully',
            imageUrl: req.file.location
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

module.exports = router;