const express = require('express');
const router = express.Router();
const queueManager = require('../services/queueManager');

/**
 * POST /api/queue/join
 * Join the queue for an event
 */
router.post('/join', async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const result = await queueManager.joinQueue(eventId, userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/queue/status/:sessionId
 * Get current queue status
 */
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const status = await queueManager.getQueueStatus(sessionId);

    res.json(status);
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/queue/leave/:sessionId
 * Leave the queue
 */
router.post('/leave/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await queueManager.leaveQueue(sessionId);

    res.json(result);
  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/queue/reorder/:eventId
 * Reorder queue by trust scores (admin/system endpoint)
 */
router.post('/reorder/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const count = await queueManager.reorderQueueByTrust(eventId);

    res.json({
      success: true,
      message: `Reordered ${count} sessions`
    });
  } catch (error) {
    console.error('Reorder queue error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/queue/advance/:eventId
 * Advance the queue (simulate ticket purchase)
 */
router.post('/advance/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { count = 1 } = req.body;

    const advancedSessions = await queueManager.advanceQueue(eventId, count);

    res.json({
      success: true,
      advancedSessions
    });
  } catch (error) {
    console.error('Advance queue error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
