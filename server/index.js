require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://elysiumbooks.app/',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
      const normalizedOrigin = origin.replace(/\/$/, '');
      return normalizedAllowed === normalizedOrigin;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ===== ROUTES =====
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const friendRoutes = require('./routes/friendRoutes');
const bookListRoutes = require('./routes/bookListRoutes');
const contactRoutes = require('./routes/contactRoutes');
const goalRoutes = require('./routes/goalRoutes');

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'elysium API is running!', allowedOrigins });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', libraryRoutes);
app.use('/api', friendRoutes);
app.use('/api', bookListRoutes);
app.use('/api', contactRoutes);
app.use('/api', goalRoutes);

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});