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

// get friends activity feed
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

    const activities = await Activity.find({
      userId: { $in: friendIds },
      isPublic: true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username displayName avatarUrl')
      .lean();

    const Library = require('../models/library');
    const formattedActivities = await Promise.all(activities.map(async (activity) => {
      let likesCount = 0;
      let isLikedByCurrentUser = false;

      if (activity.activityType === 'reviewed_book' && activity.book?.key) {
        try {
          const library = await Library.findOne({ userId: activity.userId._id });
          if (library) {
            for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
              const book = library[libraryName]?.find(b => b.key === activity.book.key);
              if (book && book.review) {
                likesCount = book.reviewLikes?.length || 0;
                isLikedByCurrentUser = currentUserId ? book.reviewLikes?.includes(currentUserId) : false;
                break;
              }
            }
          }
        } catch (err) {
          console.error('Error fetching like info:', err);
        }
      }

      return {
        ...activity,
        user: {
          username: activity.userId?.username,
          displayName: activity.userId?.displayName,
          avatarUrl: activity.userId?.avatarUrl
        },
        likesCount,
        isLikedByCurrentUser
      };
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

    const publicUsers = await User.find({ 
      $or: [
        { 'profile.isPublic': true },
        { 'profile.isPublic': { $exists: false } }
      ]
    }).select('_id');

    const publicUserIds = publicUsers.map(user => user._id);

    const activities = await Activity.find({
      userId: { $in: publicUserIds }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username displayName avatarUrl profile')
      .lean();

    const Library = require('../models/library');
    const formattedActivities = await Promise.all(activities.map(async (activity) => {
      let likesCount = 0;
      let isLikedByCurrentUser = false;

      if (activity.activityType === 'reviewed_book' && activity.book?.key) {
        try {
          const library = await Library.findOne({ userId: activity.userId._id });
          if (library) {
            for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
              const book = library[libraryName]?.find(b => b.key === activity.book.key);
              if (book && book.review) {
                likesCount = book.reviewLikes?.length || 0;
                isLikedByCurrentUser = currentUserId ? book.reviewLikes?.includes(currentUserId) : false;
                break;
              }
            }
          }
        } catch (err) {
          console.error('Error fetching like info:', err);
        }
      }

      return {
        ...activity,
        user: {
          username: activity.userId?.username,
          displayName: activity.userId?.displayName,
          avatarUrl: activity.userId?.avatarUrl
        },
        likesCount,
        isLikedByCurrentUser
      };
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching public activity feed:', error);
    res.status(500).json({ error: 'Error fetching activity feed' });
  }
};

// like a review in the activity feeds
const likeReviewFromActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const currentUserId = req.userId;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.userId.toString() === currentUserId) {
      return res.status(400).json({ error: 'Cannot like your own review' });
    }

    if (activity.activityType !== 'reviewed_book') {
      return res.status(400).json({ error: 'Only reviews can be liked' });
    }

    const bookKey = activity.book?.key;
    const reviewOwnerId = activity.userId;

    if (!bookKey) {
      return res.status(404).json({ error: 'Book key not found' });
    }

    const Library = require('../models/library');
    const library = await Library.findOne({ userId: reviewOwnerId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    let foundBook = null;
    for (const libraryName of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      foundBook = library[libraryName]?.find(b => b.key === bookKey);
      if (foundBook && foundBook.review) {
        break;
      }
    }

    if (!foundBook || !foundBook.review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!foundBook.reviewLikes) {
      foundBook.reviewLikes = [];
    }

    const likeIndex = foundBook.reviewLikes.indexOf(currentUserId);
    let liked = false;

    if (likeIndex > -1) {
      foundBook.reviewLikes.splice(likeIndex, 1);
      liked = false;
    } else {
      foundBook.reviewLikes.push(currentUserId);
      liked = true;
    }

    await library.save();

    res.json({
      message: liked ? 'Review liked' : 'Review unliked',
      liked,
      likesCount: foundBook.reviewLikes.length
    });
  } catch (error) {
    console.error('Error liking review from activity:', error);
    res.status(500).json({ error: 'Error liking review' });
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
  likeReviewFromActivity,
  getOwnActivities
};