const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  queueCapacity: {
    type: Number,
    default: 10000
  },
  currentQueueSize: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for active events lookup
eventSchema.index({ isActive: 1, date: 1 });
eventSchema.index({ artistId: 1 });

module.exports = mongoose.model('Event', eventSchema);
