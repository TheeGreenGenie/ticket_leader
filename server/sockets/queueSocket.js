const QueueSession = require('../models/QueueSession');
const queueManager = require('../services/queueManager');

/**
 * Initialize Socket.io for queue real-time updates
 */
function initializeQueueSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const { sessionId } = socket.handshake.query;

    if (sessionId) {
      // Join a room specific to this session
      socket.join(`session:${sessionId}`);
      console.log(`Session ${sessionId} joined room`);

      // Also join event room for broadcast updates
      QueueSession.findOne({ sessionId })
        .then(session => {
          if (session) {
            socket.join(`event:${session.eventId}`);
            console.log(`Session ${sessionId} joined event room: ${session.eventId}`);
          }
        })
        .catch(err => console.error('Socket join error:', err));
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Handle heartbeat to update last activity
    socket.on('heartbeat', async (data) => {
      if (data.sessionId) {
        try {
          await QueueSession.findOneAndUpdate(
            { sessionId: data.sessionId },
            { lastActivity: new Date() }
          );
        } catch (err) {
          console.error('Heartbeat update error:', err);
        }
      }
    });
  });

  return io;
}

/**
 * Emit position update to a specific session
 */
function emitPositionUpdate(io, sessionId, position, estimatedWait) {
  io.to(`session:${sessionId}`).emit('queue:position-update', {
    position,
    estimatedWait,
    timestamp: new Date()
  });
}

/**
 * Emit trust score update to a specific session
 */
function emitTrustUpdate(io, sessionId, trustScore, trustLevel) {
  io.to(`session:${sessionId}`).emit('queue:trust-update', {
    trustScore,
    trustLevel,
    timestamp: new Date()
  });
}

/**
 * Emit advance notification (user reached front of queue)
 */
function emitAdvanceNotification(io, sessionId) {
  io.to(`session:${sessionId}`).emit('queue:advance', {
    message: 'You can now purchase tickets!',
    timestamp: new Date()
  });
}

/**
 * Broadcast queue size update to all users in an event
 */
function broadcastQueueSize(io, eventId, queueSize) {
  io.to(`event:${eventId}`).emit('queue:size-update', {
    queueSize,
    timestamp: new Date()
  });
}

/**
 * Periodic queue position updater (runs every 30 seconds)
 */
function startPeriodicUpdates(io) {
  setInterval(async () => {
    try {
      // Get all active sessions
      const sessions = await QueueSession.find({ status: 'waiting' });

      for (const session of sessions) {
        const estimatedWait = queueManager.calculateEstimatedWait(session.currentPosition);

        // Emit position update
        emitPositionUpdate(
          io,
          session.sessionId,
          session.currentPosition,
          estimatedWait
        );
      }
    } catch (error) {
      console.error('Periodic update error:', error);
    }
  }, 30000); // Every 30 seconds
}

module.exports = {
  initializeQueueSocket,
  emitPositionUpdate,
  emitTrustUpdate,
  emitAdvanceNotification,
  broadcastQueueSize,
  startPeriodicUpdates
};
