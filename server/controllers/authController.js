const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Library = require('../models/library');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

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

    console.log('Login attempt for email:', email);

    // find user by email
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
     });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    console.log('User found:', user.username);
    console.log('Stored password hash:', user.password.substring(0, 20) + '...');

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match');
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

// request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.username
    );

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Error sending reset email' });
    }

    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

// reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('Reset password request received');
    console.log('Token received:', token ? 'yes' : 'no');
    console.log('New password received:', newPassword ? 'yes' : 'no');

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Password reset token is invalid or has expired'
      });
    }

    console.log('User found:', user.username);
    console.log('Hashing new password...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log('New password hashed successfully');
    console.log('Old password hash:', user.password.substring(0, 20) + '...');
    console.log('New password hash:', hashedPassword.substring(0, 20) + '...');

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    console.log('User saved with new password');

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  requestPasswordReset,
  resetPassword
};