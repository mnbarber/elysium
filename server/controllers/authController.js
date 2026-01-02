const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Library = require('../models/library');

// new user registration
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    // create new user
    const user = new User({ username, email, password });
    await user.save();

    // create empty library for the user
    const library = new Library({
        user: user._id,
        toRead: [],
        currentlyReading: [],
        read: [],
        paused: [],
        dnf: []
    });
    await library.save();

    // create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { userId: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// user login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { userId: user._id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
};

// get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if(!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user data.' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};