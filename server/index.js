require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Library = require('./models/library');
const Friend = require('./models/friend');
const Activity = require('./models/activity');
const auth = require('./middleware/auth');

console.log('1. imports loaded');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('2. app initialized');

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

console.log('3. middleware configured');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// create activity
const createActivity = async (userId, activityType, data) => {
  try {
    const activity = new Activity({
      userId,
      activityType,
      ...data
    });
    await activity.save();
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book Library API is running!',
    allowedOrigins: allowedOrigins 
  });
});

console.log('4. routes setup starting');

// ===== AUTH ROUTES =====

console.log('5. auth routes loaded');

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

console.log('6. book & library routes loaded');

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

// browse books by genre using Open Library API
app.get('/api/books/browse/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const formattedGenre = genre.toLowerCase().replace(/\s+/g, '_');
    const response = await axios.get(`https://openlibrary.org/subjects/${formattedGenre}.json?limit=${limit}&offset=${offset}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books by genre' });
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

// Move book between libraries
console.log('Moving book route loading');
app.post('/api/libraries/move', auth, async (req, res) => {
  try {
    console.log('move request received:', req.body);
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

    // Find the book in the source library
    let bookToMove = null;
    if (fromLibrary && fieldMap[fromLibrary]) {
      const fromField = fieldMap[fromLibrary];
      if (!library[fromField]) {
        library[fromField] = [];
      }
      const bookIndex = library[fromField].findIndex(b => b.key === book.key);
      if (bookIndex !== -1) {
        bookToMove = library[fromField][bookIndex];
        library[fromField].splice(bookIndex, 1);
      }
    }

    // If moving to 'read' library, increment readCount and set completion date
    if (toLibrary === 'read' && bookToMove) {
      bookToMove.readCount = (bookToMove.readCount || 0) + 1;
      bookToMove.completedAt = new Date();  // Add this line
    }

    // Add to new library
    const toField = fieldMap[toLibrary];
    if (toField) {
      if (!library[toField]) {
        library[toField] = [];
      }
      // Use bookToMove if we found it, otherwise use the book from request
      const bookData = bookToMove || {
        ...book,
        completedAt: toLibrary === 'read' ? new Date() : undefined
      };
      if (!library[toField].some(b => b.key === bookData.key)) {
        library[toField].push(bookData);
      }
    }

    await library.save();

    // Create activity
    if (toLibrary === 'read') {
      const activityBook = bookToMove || book;
      await createActivity(req.userId, 'finished_book', {
        book: {
          key: activityBook.key,
          title: activityBook.title,
          author: activityBook.author,
          coverUrl: activityBook.coverUrl
        }
      });
    } else {
      const activityBook = bookToMove || book;
      await createActivity(req.userId, 'moved_book', {
        book: {
          key: activityBook.key,
          title: activityBook.title,
          author: activityBook.author,
          coverUrl: activityBook.coverUrl,
          readCount: activityBook.readCount || 0
        },
        fromLibrary: fromLibrary,
        toLibrary: toLibrary
      });
    }

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

    await createActivity(req.userId, 'added_book', {
      book: {
        key: book.key,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl
      },
      libraryName: libraryName
    });

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



console.log('7. rating routes loading');

// rate a book -- adds to 'read' if not already in a library
app.post('/api/books/rate', auth, async (req, res) => {
  try {
    const { book, rating } = req.body;
  
    if(!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
  
    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }
  
    // Check if book is already in any library
    const allLibraries = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];
    let bookFound = false;
    let bookLibrary = null;
  
    for (const lib of allLibraries) {
      const bookIndex = library[lib].findIndex(b => b.key === book.key);
      if (bookIndex !== -1) {
        bookFound = true;
        bookLibrary = lib;
        // Update rating if in 'read' library
        if (lib === 'read') {
          library.read[bookIndex].rating = rating;
          if (!library.read[bookIndex].completedAt) {
            library.read[bookIndex].completedAt = new Date();
          }
          await library.save();

          await createActivity(req.userId, 'rated_book', {
            book: {
              key: book.key,
              title: library.read[bookIndex].title,
              author: library.read[bookIndex].author,
              coverUrl: library.read[bookIndex].coverUrl
            },
            rating: rating
          });

          return res.json({
            message: 'Book rating updated successfully',
            book: library[lib][bookIndex],
            libraries: {
              'to-read': library.toRead || [],
              'currently-reading': library.currentlyReading || [],
              'read': library.read || [],
              'paused': library.paused || [],
              'dnf': library.dnf || []
            }
          });
        }

        // if book is in another library, move it to 'read' with rating
        const bookToMove = library[lib][bookIndex];
        bookToMove.rating = rating;
        bookToMove.completedAt = new Date();
        library[lib].splice(bookIndex, 1);
        library.read.push(bookToMove);
        await library.save();

        await createActivity(req.userId, 'finished_book', {
          book: {
            key: bookToMove.key,
            title: bookToMove.title,
            author: bookToMove.author,
            coverUrl: bookToMove.coverUrl
          }
        });

        await createActivity(req.userId, 'rated_book', {
          book: {
            key: bookToMove.key,
            title: bookToMove.title,
            author: bookToMove.author,
            coverUrl: bookToMove.coverUrl
          },
          rating: rating
        });

        return res.json({
          message: 'Book moved to Read library with rating',
          book: bookToMove,
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      }
    }
  
    // If book not found in any library, add to 'read' with rating
    const newBook = {
      ...book,
      rating: rating,
      completedAt: new Date()
    };
    library.read.push(newBook);
    await library.save();

    await createActivity(req.userId, 'added_book', {
      book: {
        key: newBook.key,
        title: newBook.title,
        author: newBook.author,
        coverUrl: newBook.coverUrl
      },
      libraryName: 'read'
    });

    await createActivity(req.userId, 'rated_book', {
      book: {
        key: newBook.key,
        title: newBook.title,
        author: newBook.author,
        coverUrl: newBook.coverUrl
      },
      rating: rating
    });
  
    res.json({
      message: 'Book added to Read library with rating',
      book: newBook,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error rating book:', error);
    res.status(500).json({ error: 'Error rating book' });
  }
});

// update rating for a book already in 'read'
app.put('/api/books/rate/:bookKey', auth, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { rating } = req.body;
    const decodedKey = decodeURIComponent(bookKey);

    if(!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const bookIndex = library.read.findIndex(b => b.key === decodedKey);
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found in Read library' });
    }

    library.read[bookIndex].rating = rating;
    await library.save();

    res.json({
      message: 'Book rating updated successfully',
      book: library.read[bookIndex],
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });
  } catch (error) {
    console.error('Error updating book rating:', error);
    res.status(500).json({ error: 'Error updating book rating' });
  }
});

// ====== REVIEW ROUTES ======

console.log('8. review routes loading');

// add or update a review for a book
app.post('/api/books/review', auth, async (req, res) => {
  console.log('review route hit');
  try {
    const { book, review } = req.body;

    if (!review || review.trim() === '') {
      return res.status(400).json({ error: 'Review cannot be empty' });
    }

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const allLibraries = ['toRead', 'currentlyReading', 'read', 'paused', 'dnf'];
    let bookFound = false;
    let bookLibrary = null;

    for (const lib of allLibraries) {
      const bookIndex = library[lib].findIndex(b => b.key === book.key);
      if (bookIndex !== -1) {
        bookFound = true;
        bookLibrary = lib;
        
        if (lib === 'read') {
          library.read[bookIndex].review = review;
          library.read[bookIndex].updatedAt = new Date();
          await library.save();

          await createActivity(req.userId, 'reviewed_book', {
            book: {
              key: book.key,
              title: library.read[bookIndex].title,
              author: library.read[bookIndex].author,
              coverUrl: library.read[bookIndex].coverUrl
            },
            review: review
          });

          return res.json({
            message: 'Book review updated successfully',
            book: library.read[bookIndex],
            libraries: {
              'to-read': library.toRead || [],
              'currently-reading': library.currentlyReading || [],
              'read': library.read || [],
              'paused': library.paused || [],
              'dnf': library.dnf || []
            }
          });
        }

        // if book is in another library, move it to 'read' with review
        const bookToMove = library[lib][bookIndex];
        bookToMove.review = review;
        bookToMove.updatedAt = new Date();
        library[lib].splice(bookIndex, 1);
        library.read.push(bookToMove);
        await library.save();

        await createActivity(req.userId, 'finished_book', {
          book: {
            key: book.key,
            title: bookToMove.title,
            author: bookToMove.author,
            coverUrl: bookToMove.coverUrl
          },
          review: review
        });

        await createActivity(req.userId, 'reviewed_book', {
          book: {
            key: bookToMove.key,
            title: bookToMove.title,
            author: bookToMove.author,
            coverUrl: bookToMove.coverUrl
          },
          review: review
        });

        return res.json({
          message: 'Book review updated successfully',
          book: library.read[library.read.length - 1],
          libraries: {
            'to-read': library.toRead || [],
            'currently-reading': library.currentlyReading || [],
            'read': library.read || [],
            'paused': library.paused || [],
            'dnf': library.dnf || []
          }
        });
      }
    }

    // If book not found in any library, add to 'read' with review
    const newBook = {
      ...book,
      review: review,
      updatedAt: new Date()
    };
    library.read.push(newBook);
    await library.save();

    await createActivity(req.userId, 'added_book', {
      book: {
        key: newBook.key,
        title: newBook.title,
        author: newBook.author,
        coverUrl: newBook.coverUrl
      },
      libraryName: 'read'
    });

    await createActivity(req.userId, 'reviewed_book', {
      book: {
        key: newBook.key,
        title: newBook.title,
        author: newBook.author,
        coverUrl: newBook.coverUrl
      },
      review: review
    });

    return res.json({
      message: 'Book review added successfully',
      book: newBook,
      libraries: {
        'to-read': library.toRead || [],
        'currently-reading': library.currentlyReading || [],
        'read': library.read || [],
        'paused': library.paused || [],
        'dnf': library.dnf || []
      }
    });

  } catch (error) {
    console.error('Error updating book review:', error);
    res.status(500).json({ error: 'Error updating book review' });
  }
});

// get review for a book
app.get('/api/books/review/:bookKey', auth, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const decodedKey = decodeURIComponent(bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Find the book in all libraries
    let book = null;
    for (const lib of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      book = library[lib].find(b => b.key === decodedKey);
      if (book) break;
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found in any library' });
    }

    // Return the review if it exists
    if (book.review) {
      return res.json({ review: book.review });
    } else {
      return res.status(404).json({ error: 'No review found for this book' });
    }
  } catch (error) {
    console.error('Error fetching book review:', error);
    res.status(500).json({ error: 'Error fetching book review' });
  }
});

// delete a review
app.delete('/api/books/review/:bookKey', auth, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const decodedKey = decodeURIComponent(bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Find the book in all libraries
    let book = null;
    for (const lib of ['toRead', 'currentlyReading', 'read', 'paused', 'dnf']) {
      book = library[lib].find(b => b.key === decodedKey);
      if (book) break;
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found in any library' });
    }

    // Remove the review from the book
    book.review = null;
    await library.save();

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Error deleting review' });
  }
});

// ====== PROFILE ROUTES ======

console.log('9. profile routes loading');

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

// get reading stats for a user
app.get('/api/stats/reading', auth, async (req, res) => {
  try {
    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // count books read this year
    const booksThisYear = library.read.filter(book => {
      if (!book.completedAt) return false;
      const completedDate = new Date(book.completedAt);
      return completedDate >= yearStart && completedDate <= now;
    });

    // calculate monthly breakdown
    const monthlyBreakdown = {};
    for (let i = 0; i < 12; i++) {
      monthlyBreakdown[i] = 0;
    }

    booksThisYear.forEach(book => {
      const month = new Date(book.completedAt).getMonth();
      monthlyBreakdown[month]++;
    });

    // get reading streak
    const activities = await Activity.find({
      userId: req.userId,
      activityType: 'finished_book'
    }).sort({ createdAt: -1 });

    res.json({
      totalBooksRead: library.read.length,
      booksThisYear: booksThisYear.length,
      booksThisMonth: booksThisYear.filter(book => new Date(book.completedAt).getMonth() === now.getMonth()).length,
      monthlyBreakdown: monthlyBreakdown,
      currentYear: currentYear,
      recentlyFinishedBooks: booksThisYear.slice(-5).map(book => ({
        key: book.key,
        title: book.title,
        author: book.author,
        completedAt: book.completedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    res.status(500).json({ error: 'Error fetching reading stats' });
  }
});

// Update completion date for a book in read library
app.put('/api/books/completion-date/:bookKey', auth, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { completedAt } = req.body;
    const decodedKey = decodeURIComponent(bookKey);

    const library = await Library.findOne({ userId: req.userId });
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const bookIndex = library.read.findIndex(b => b.key === decodedKey);
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found in read library' });
    }

    library.read[bookIndex].completedAt = new Date(completedAt);
    await library.save();

    res.json({
      message: 'Completion date updated',
      book: library.read[bookIndex]
    });
  } catch (error) {
    console.error('Error updating completion date:', error);
    res.status(500).json({ error: 'Error updating completion date' });
  }
});

// ======= FRIEND ROUTES =======

console.log('10. friend routes loading');

// send friend request
app.post('/api/friends/request/:username', auth, async (req, res) => {
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
});

// get incoming friend requests
app.get('/api/friends/requests', auth, async (req, res) => {
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
});

// accept friend request
app.post('/api/friends/accept/:requestId', auth, async (req, res) => {
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
});

// reject friend request
app.post('/api/friends/reject/:requestId', auth, async (req, res) => {
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
});

// get friends list
app.get('/api/friends', auth, async (req, res) => {
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
});

// remove friend
app.delete('/api/friends/:friendId', auth, async (req, res) => {
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
});

// check friendship status
app.get('/api/friends/status/:username', auth, async (req, res) => {
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
});

console.log('11. activity routes loading');

// activity feed-- friends' activity
app.get('/api/activities/feed', auth, async (req, res) => {
  try {
    // get friends' ids
    const friends = await Friend.find({
      $or: [
        { userId: req.userId, status: 'accepted' },
        { friendId: req.userId, status: 'accepted' }
      ]
    });

    const friendIds = friends.map(f => f.userId.equals(req.userId) ? f.friendId : f.userId);

    // get recent activities
    const activities = await Activity.find({ userId: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'username profile.displayName profile.avatarUrl');

    const formattedActivities = activities.map(act => ({
      id: act._id,
      user: {
        username: act.userId.username,
        displayName: act.userId.profile.displayName || act.userId.username,
        avatarUrl: act.userId.profile.avatarUrl
      },
      activityType: act.activityType,
      book: act.book,
      libraryName: act.libraryName,
      rating: act.rating,
      fromLibrary: act.fromLibrary,
      toLibrary: act.toLibrary,
      createdAt: act.createdAt
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Error fetching activity feed' });
  }
});

// get own activities
app.get('/api/activities/me', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching own activities:', error);
    res.status(500).json({ error: 'Error fetching own activities' });
  }
});

app.listen(PORT, () => {
  console.log(`12. Server running on port ${PORT}`);
});