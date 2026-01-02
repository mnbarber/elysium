const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

// Friend requests
router.post('/friends/request/:username', auth, friendController.sendFriendRequest);
router.get('/friends/requests', auth, friendController.getFriendRequests);
router.post('/friends/accept/:requestId', auth, friendController.acceptFriendRequest);
router.post('/friends/reject/:requestId', auth, friendController.rejectFriendRequest);

// Friends management
router.get('/friends', auth, friendController.getFriendsList);
router.delete('/friends/:friendId', auth, friendController.removeFriend);
router.get('/friends/status/:username', auth, friendController.getFriendshipStatus);

// Activity feed
router.get('/activities/feed', auth, friendController.getActivityFeed);
router.get('/activities/me', auth, friendController.getOwnActivities);

module.exports = router;