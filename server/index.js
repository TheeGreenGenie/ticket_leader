require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const queueRoutes = require('./routes/queue');
const contentRoutes = require('./routes/content');
const gamesRoutes = require('./routes/games');
const syncRoutes = require('./routes/sync');
const ttsRoutes = require('./routes/tts');

const { initializeQueueSocket, startPeriodicUpdates } = require('./sockets/queueSocket');

const app = express();
const server = http.createServer(app);

const DEFAULT_ORIGINS = ['http://127.0.0.1:4001'];
const corsOrigins = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/tts', ttsRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Initialize Socket.io
initializeQueueSocket(io);

// Make io accessible to routes (for emitting events)
app.set('io', io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Socket.io initialized');
      // Start periodic queue updates
      startPeriodicUpdates(io);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
