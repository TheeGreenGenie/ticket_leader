const mongoose = require('mongoose');

const behavioralStreamSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['mouse_move', 'scroll', 'click', 'keypress', 'focus', 'blur'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  entropy: {
    type: Number,
    default: 0
  }
});

// Index for efficient session-based queries and cleanup
behavioralStreamSchema.index({ sessionId: 1, timestamp: -1 });
behavioralStreamSchema.index({ timestamp: 1 }); // For TTL cleanup

module.exports = mongoose.model('BehavioralStream', behavioralStreamSchema);
