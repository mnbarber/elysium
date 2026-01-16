const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

// friend requests
router.post('/friends/request/:username', auth, friendController.sendFriendRequest);
router.get('/friends/requests', auth, friendController.getFriendRequests);
router.post('/friends/accept/:requestId', auth, friendController.acceptFriendRequest);
router.post('/friends/reject/:requestId', auth, friendController.rejectFriendRequest);

// friends management
router.get('/friends', auth, friendController.getFriendsList);
router.delete('/friends/:friendId', auth, friendController.removeFriend);
router.get('/friends/status/:username', auth, friendController.getFriendshipStatus);

// activity feed
router.get('/activity/friends', auth, friendController.getFriendsActivityFeed);
router.get('/activity/public', friendController.getPublicActivityFeed);
router.post('/activity/:activityId/like', auth, friendController.likeReviewFromActivity);
router.get('/activities/me', auth, friendController.getOwnActivities);

module.exports = router;