const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
  console.log('Profile routes - Request to:', req.path);
  next();
});

router.get('/profile', auth, async (req, res) => {
  console.log('GET /profile route hit');
  console.log('req.userId:', req.userId);
  return res.json({ test: 'Route is working', userId: req.userId });
//   return profileController.getOwnProfile(req, res);
});
router.get('/profile/:username', profileController.getPublicProfile);
router.put('/profile/:username/edit', auth, profileController.updateProfile);
router.get('/users/search', profileController.searchUsers);

module.exports = router;