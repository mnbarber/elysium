require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Library = require('./models/library');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://elysium-rho-navy.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

console.log('Allowed origins:', allowedOrigins); // Debug log

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Remove trailing slash for comparison
      const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
      const normalizedOrigin = origin.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin); // Debug log
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book Library API is running!',
    allowedOrigins: allowedOrigins 
  });
});

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const library = new Library({
      userId: user._id,
      toRead: [],
      currentlyReading: [],
      read: []
    });
    await library.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// ===== BOOK & LIBRARY ROUTES =====

// search books with Open Library API
app.get('/api/books/search', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch books from Open Library' });
    }
});

// Get user's libraries
app.get('/api/libraries', auth, async (req, res) => {
  try {
    let library = await Library.findOne({ userId: req.userId });
    
    if (!library) {
      library = new Library({
        userId: req.userId,
        toRead: [],
        currentlyReading: [],
        read: [],
        paused: [],
        dnf: []
      });
      await library.save();
    }

    res.json({
      'to-read': library.toRead,
      'currently-reading': library.currentlyReading,
      'read': library.read,
      'paused': library.paused,
      'dnf': library.dnf
    });
  } catch (error) {
    console.error('Error fetching libraries:', error);
    res.status(500).json({ error: 'Error fetching libraries' });
  }
});

// Add book to library
app.post('/api/libraries/:libraryName', auth, async (req, res) => {
  try {
    const { libraryName } = req.params;
    const book = req.body;

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const fieldMap = {
      'to-read': 'toRead',
      'currently-reading': 'currentlyReading',
      'read': 'read',
      'paused': 'paused',
      'dnf': 'dnf'
    };

    const field = fieldMap[libraryName];
    if (!field) {
      return res.status(400).json({ error: 'Invalid library name' });
    }

    // Initialize field if it doesn't exist
    if (!library[field]) {
      library[field] = [];
    }

    // Check if book already exists
    const exists = library[field].some(b => b.key === book.key);
    if (exists) {
      return res.status(400).json({ error: 'Book already in this library' });
    }

    library[field].push(book);
    await library.save();

    res.json({
      message: 'Book added successfully',
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Error adding book' });
  }
});

// Remove book from library
app.delete('/api/libraries/:libraryName/:bookKey', auth, async (req, res) => {
  try {
    const { libraryName, bookKey } = req.params;
    const decodedKey = decodeURIComponent(bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const fieldMap = {
      'to-read': 'toRead',
      'currently-reading': 'currentlyReading',
      'read': 'read',
      'paused': 'paused',
      'dnf': 'dnf'
    };

    const field = fieldMap[libraryName];
    if (!field) {
      return res.status(400).json({ error: 'Invalid library name' });
    }

     // Initialize field if it doesn't exist
    if (!library[field]) {
      library[field] = [];
    }

    library[field] = library[field].filter(book => book.key !== decodedKey);
    await library.save();

    res.json({
      message: 'Book removed successfully',
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error removing book:', error);
    res.status(500).json({ error: 'Error removing book' });
  }
});

// Move book between libraries
app.post('/api/libraries/move', auth, async (req, res) => {
  try {
    const { book, fromLibrary, toLibrary } = req.body;

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const fieldMap = {
      'to-read': 'toRead',
      'currently-reading': 'currentlyReading',
      'read': 'read',
      'paused': 'paused',
      'dnf': 'dnf'
    };

    // Remove from old library
    if (fromLibrary && fieldMap[fromLibrary]) {
      const fromField = fieldMap[fromLibrary];
      if (!library[fromField]) {
        library[fromField] = [];
      }
      library[fromField] = library[fromField].filter(b => b.key !== book.key);
    }

    // Add to new library
    const toField = fieldMap[toLibrary];
    if (toField) {
      if (!library[toField]) {
        library[toField] = [];
      }
      if (!library[toField].some(b => b.key === book.key)) {
        library[toField].push(book);
      }
    }

    await library.save();

    res.json({
      message: 'Book moved successfully',
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error moving book:', error);
    res.status(500).json({ error: 'Error moving book' });
  }
});

// ====== PROFILE ROUTES ======

// get public profile by username
app.get('/api/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //get user's libraries
    const library = await Library.findOne({ userId: user._id });

    res.json({
      profile: user.getPublicProfile(),
      stats: {
        toReadCount: library ? library.toRead.length : 0,
        currentlyReadingCount: library ? library.currentlyReading.length : 0,
        readCount: library ? library.read.length : 0,
        pausedCount: library ? library.paused.length : 0,
        dnfCount: library ? library.dnf.length : 0
      },
      libraries: user.profile.isPublic ? {
        'to-read': library ? library.toRead : [],
        'currently-reading': library ? library.currentlyReading : [],
        'read': library ? library.read : [],
        'paused': library ? library.paused : [],
        'dnf': library ? library.dnf : []
      } : null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// update profile
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl, isPublic } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profile.displayName = displayName || user.profile.displayName;
    user.profile.bio = bio || user.profile.bio;
    user.profile.avatarUrl = avatarUrl || user.profile.avatarUrl;
    if (typeof isPublic === 'boolean') {
      user.profile.isPublic = isPublic;
    }

    await user.save();

    res.json({ message: 'Profile updated successfully', profile: user.getPublicProfile() });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// get own profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user.getPublicProfile() });
  } catch (error) {
    console.error('Error fetching own profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// search users by username
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ users: [] });
    }

    const regex = new RegExp(q, 'i'); // case-insensitive search
    const users = await User.find({ username: regex }).select('username profile.displayName profile.avatarUrl');

    res.json({ users: users.map(user => user.getPublicProfile()) });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Error searching users' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});