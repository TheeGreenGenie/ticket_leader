const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  currentPosition: {
    type: Number,
    required: true
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  trustLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'silver'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'expired'],
    default: 'waiting'
  },
  behavioralData: {
    mouseMovements: {
      type: Number,
      default: 0
    },
    scrollEvents: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReasons: [{ type: String }]
});

// Compound index for efficient queries
queueSessionSchema.index({ eventId: 1, status: 1, currentPosition: 1 });

// Method to calculate trust level from score
queueSessionSchema.methods.updateTrustLevel = function() {
  if (this.trustScore >= 81) {
    this.trustLevel = 'platinum';
  } else if (this.trustScore >= 61) {
    this.trustLevel = 'gold';
  } else if (this.trustScore >= 41) {
    this.trustLevel = 'silver';
  } else {
    this.trustLevel = 'bronze';
  }
};

module.exports = mongoose.model('QueueSession', queueSessionSchema);
