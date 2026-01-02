const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/profile/:username', profileController.getPublicProfile);
router.get('/profile', auth, profileController.getOwnProfile);
router.put('/profile', auth, profileController.updateProfile);
router.get('/users/search', profileController.searchUsers);

module.exports = router;