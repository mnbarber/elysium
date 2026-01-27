require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ===== MIDDLEWARE =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://elysiumbooks.app/',
  process.env.CLIENT_URL
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
const uploadRoutes = require('./routes/uploadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const quoteRoutes = require('./routes/quoteRoutes');

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
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/quotes', quoteRoutes);

const jwt = require('jsonwebtoken');

// ===== SOCKET.IO SETUP =====
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  onlineUsers.set(socket.userId, socket.id);
  socket.broadcast.emit('user-online', socket.userId);
  socket.join(socket.userId);

  socket.on('send-message', async (data) => {
    const { recipientId, content, conversationId } = data;

    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', {
        conversationId,
        senderId: socket.userId,
        content,
        createdAt: new Date()
      });
    }
  });

  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-typing', {
        conversationId: data.conversationId,
        userId: socket.userId
      });
    }
  });

  socket.on('stop-typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-stop-typing', {
        conversationId: data.conversationId,
        userId: socket.userId
      });
    }
  });

  socket.on('mark-read', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('messages-read', {
        conversationId: data.conversationId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('user-offline', socket.userId);
  });
});

const PORT = process.env.PORT || 3000;

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});