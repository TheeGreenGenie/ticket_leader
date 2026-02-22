const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  available:   { type: Number, required: true },
  total:       { type: Number, required: true },
});

const eventSchema = new mongoose.Schema({
  slug:      { type: String, required: true, unique: true, index: true },
  title:     { type: String, required: true },
  subtitle:  { type: String, default: '' },
  date:      { type: String, default: '' },
  time:      { type: String, default: '' },
  venue:     { type: String, default: '' },
  city:      { type: String, default: '' },
  basePrice: { type: Number, default: 0 },
  image:     { type: String, default: '' },
  sections:  [sectionSchema],
}, { timestamps: true });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
