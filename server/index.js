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

app.get('/', (req, res) => {
  res.json({ message: 'Book Library API is running!' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Create empty library for user
    const library = new Library({
      userId: user._id,
      toRead: [],
      currentlyReading: [],
      read: []
    });
    await library.save();

    // Create token
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
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

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

app.get('/api/books/search', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch books from Open Library' });
    }
});

app.get('/api/libraries', auth, async (req, res) => {
  try {
    let library = await Library.findOne({ userId: req.userId });
    
    if (!library) {
      library = new Library({
        userId: req.userId,
        toRead: [],
        currentlyReading: [],
        read: []
      });
      await library.save();
    }

    res.json({
      'to-read': library.toRead,
      'currently-reading': library.currentlyReading,
      'read': library.read
    });
  } catch (error) {
    console.error('Error fetching libraries:', error);
    res.status(500).json({ error: 'Error fetching libraries' });
  }
});

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
      'read': 'read'
    };

    const field = fieldMap[libraryName];
    if (!field) {
      return res.status(400).json({ error: 'Invalid library name' });
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
        'to-read': library.toRead,
        'currently-reading': library.currentlyReading,
        'read': library.read
      }
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Error adding book' });
  }
});

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
      'read': 'read'
    };

    const field = fieldMap[libraryName];
    if (!field) {
      return res.status(400).json({ error: 'Invalid library name' });
    }

    library[field] = library[field].filter(book => book.key !== decodedKey);
    await library.save();

    res.json({
      message: 'Book removed successfully',
      libraries: {
        'to-read': library.toRead,
        'currently-reading': library.currentlyReading,
        'read': library.read
      }
    });
  } catch (error) {
    console.error('Error removing book:', error);
    res.status(500).json({ error: 'Error removing book' });
  }
});

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
      'read': 'read'
    };

    // Remove from old library
    if (fromLibrary && fieldMap[fromLibrary]) {
      const fromField = fieldMap[fromLibrary];
      library[fromField] = library[fromField].filter(b => b.key !== book.key);
    }

    // Add to new library
    const toField = fieldMap[toLibrary];
    if (toField && !library[toField].some(b => b.key === book.key)) {
      library[toField].push(book);
    }

    await library.save();

    res.json({
      message: 'Book moved successfully',
      libraries: {
        'to-read': library.toRead,
        'currently-reading': library.currentlyReading,
        'read': library.read
      }
    });
  } catch (error) {
    console.error('Error moving book:', error);
    res.status(500).json({ error: 'Error moving book' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});