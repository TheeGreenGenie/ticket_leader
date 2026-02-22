const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// POST /api/orders
router.post('/', async (req, res) => {
  const { eventSlug, eventTitle, sectionId, sectionName, quantity, pricePerTicket } = req.body;

  if (!eventSlug || !sectionName || !quantity || !pricePerTicket) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  if (quantity < 1 || quantity > 6) {
    return res.status(400).json({ message: 'Quantity must be between 1 and 6.' });
  }

  try {
    const totalPrice = quantity * pricePerTicket;
    const order = await Order.create({
      eventSlug,
      eventTitle,
      sectionId,
      sectionName,
      quantity,
      pricePerTicket,
      totalPrice,
      status: 'reserved',
    });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
