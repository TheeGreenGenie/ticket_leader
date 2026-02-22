const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  eventSlug:      { type: String, required: true },
  eventTitle:     { type: String, required: true },
  sectionId:      { type: mongoose.Schema.Types.ObjectId },
  sectionName:    { type: String, required: true },
  quantity:       { type: Number, required: true, min: 1, max: 6 },
  pricePerTicket: { type: Number, required: true },
  totalPrice:     { type: Number, required: true },
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'cancelled'],
    default: 'reserved',
  },
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
