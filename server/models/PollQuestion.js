const mongoose = require('mongoose');

const pollQuestionSchema = new mongoose.Schema({
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['single-choice', 'slider'],
    required: true
  },
  options: {
    type: [String],
    default: null
  },
  sliderRange: {
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    }
  },
  category: {
    type: String,
    default: 'general'
  },
  // Mock results for visualization
  mockResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient artist-based queries
pollQuestionSchema.index({ artistId: 1 });

module.exports = mongoose.model('PollQuestion', pollQuestionSchema);
