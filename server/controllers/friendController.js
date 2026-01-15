const Friend = require('../models/friend');
const User = require('../models/user');
const Activity = require('../models/activity');

// send friend request
const sendFriendRequest = async (req, res) => {
    try {
        const { username } = req.params;

        // find the user to be friended
        const friendUser = await User.findOne({ username });
        if (!friendUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // prevent sending request to self
        if (friendUser._id.equals(req.userId)) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        // check if you're already friends
        const existingFriend = await Friend.findOne({
            $or: [
                { userId: req.userId, friendId: friendUser._id },
                { userId: friendUser._id, friendId: req.userId }
            ],
        });

        if (existingFriend) {
            if (existingFriend.status === 'accepted') {
                return res.status(400).json({ error: 'You are already friends' });
            } else if (existingFriend.status === 'pending') {
                return res.status(400).json({ error: 'Friend request already pending' });
            }
        }

        // create new friend request
        const friendRequest = new Friend({
            userId: req.userId,
            friendId: friendUser._id,
            status: 'pending'
        });

        await friendRequest.save();

        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ error: 'Error sending friend request' });
    }
};

// get incoming friend requests
const getFriendRequests = async (req, res) => {
    try {
        const requests = await Friend.find({ friendId: req.userId, status: 'pending' })
            .populate('userId', 'username profile.displayName profile.avatarUrl');

        res.json({
            requests: requests.map(req => ({
                id: req._id,
                user: {
                    id: req.userId._id,
                    username: req.userId.username,
                    displayName: req.userId.profile.displayName || req.userId.username,
                },
                createdAt: req.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ error: 'Error fetching friend requests' });
    }
};

// accept friend request
const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const friendRequest = await Friend.findById(requestId);
        if (!friendRequest || !friendRequest.friendId.equals(req.userId) || friendRequest.status !== 'pending') {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'Error accepting friend request' });
    }
};

// reject friend request
const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const friendRequest = await Friend.findById(requestId);
        if (!friendRequest || !friendRequest.friendId.equals(req.userId) || friendRequest.status !== 'pending') {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        await Friend.findByIdAndDelete(requestId);

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ error: 'Error rejecting friend request' });
    }
};

// get friends list
const getFriendsList = async (req, res) => {
    try {
        const friends = await Friend.find({
          $or: [
            { userId: req.userId, status: 'accepted' },
            { friendId: req.userId, status: 'accepted' }
          ]
        }).populate('userId friendId', 'username profile.displayName profile.avatarUrl');
    
        const friendList = friends.map(f => {
          const friend = f.userId._id.equals(req.userId) ? f.friendId : f.userId;
          return {
            id: friend._id,
            username: friend.username,
            displayName: friend.profile.displayName || friend.username,
            avatarUrl: friend.profile.avatarUrl
          };
        });
    
        res.json({ friends: friendList });
      } catch (error) {
        console.error('Error fetching friends list:', error);
        res.status(500).json({ error: 'Error fetching friends list' });
      }
};

// remove friend
const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
    
        await Friend.findOneAndDelete({
          $or: [
            { userId: req.userId, friendId },
            { userId: friendId, friendId: req.userId }
          ],
        });
    
        res.json({ message: 'Friend removed successfully' });
      } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Error removing friend' });
      }
};

// get friendship status
const getFriendshipStatus = async (req, res) => {
    try {
        const { username } = req.params;
    
        const otherUser = await User.findOne({ username });
        if (!otherUser) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        const friendship = await Friend.findOne({
          $or: [
            { userId: req.userId, friendId: otherUser._id },
            { userId: otherUser._id, friendId: req.userId }
          ],
        });
    
        let status = 'none';
        if (friendship) {
          status = friendship.status;
          if (friendship.status === 'pending') {
            status = friendship.userId.equals(req.userId) ? 'request_sent' : 'request_received';
          }
        }
    
        res.json({ status });
      } catch (error) {
        console.error('Error checking friendship status:', error);
        res.status(500).json({ error: 'Error checking friendship status' });
      }
};

// get activity feed
const getFriendsActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const friendships = await Friend.find({
      $or: [
        { userId: req.userId, status: 'accepted' },
        { friendId: req.userId, status: 'accepted' }
      ]
    });

    if (!friendships || friendships.length === 0) {
      return res.json({ activities: [] });
    }

    const friendIds = friendships.map(friendship => {
      if (friendship.userId.toString() === req.userId.toString()) {
        return friendship.friendId;
      } else {
        return friendship.userId;
      }
    });

    console.log('Friend IDs:', friendIds);

    const activities = await Activity.find({
      userId: { $in: friendIds },
      isPublic: true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username displayName avatarUrl')
      .lean();
    console.log('Fetched activities:', activities);

    const formattedActivities = activities.map(activity => ({
      ...activity,
      user: {
        username: activity.userId?.username,
        displayName: activity.userId?.displayName,
        avatarUrl: activity.userId?.avatarUrl
      }
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching friends activity feed:', error);
    res.status(500).json({ error: 'Error fetching friends activity feed' });
  }
};

// get public activity feed
const getPublicActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .populate({
        path: 'userId',
        select: 'username displayName avatarUrl isPublic',
        match: { isPublic: true }
      })
      .lean();

    const publicActivities = activities
      .filter(activity => activity.userId !== null)
      .slice(0, limit);

    console.log(`Showing ${publicActivities.length} activities from public profiles`);

    const formattedActivities = publicActivities.map(activity => ({
      ...activity,
      user: {
        username: activity.userId?.username,
        displayName: activity.userId?.displayName,
        avatarUrl: activity.userId?.avatarUrl
      }
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching public activity feed:', error);
    res.status(500).json({ error: 'Error fetching activity feed' });
  }
};

// get own activities
const getOwnActivities = async (req, res) => {
    try {
        const activities = await Activity.find({ userId: req.userId })
          .sort({ createdAt: -1 })
          .limit(50);
    
        res.json({ activities });
      } catch (error) {
        console.error('Error fetching own activities:', error);
        res.status(500).json({ error: 'Error fetching own activities' });
      }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  removeFriend,
  getFriendshipStatus,
  getFriendsActivityFeed,
  getPublicActivityFeed,
  getOwnActivities
};