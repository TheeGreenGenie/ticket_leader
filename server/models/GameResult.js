const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  gameType: {
    type: String,
    enum: ['trivia', 'poll'],
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  responseTime: {
    type: Number,
    required: true
  },
  trustBoostEarned: {
    type: Number,
    default: 0
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for session-based queries
gameResultSchema.index({ sessionId: 1, playedAt: -1 });

module.exports = mongoose.model('GameResult', gameResultSchema);
