const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  genre: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Note: unique: true on slug already creates an index

module.exports = mongoose.model('Artist', artistSchema);
