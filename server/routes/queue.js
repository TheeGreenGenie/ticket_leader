const express = require('express');
const router = express.Router();
const queueManager = require('../services/queueManager');
const QueueSession = require('../models/QueueSession');
const Event = require('../models/Event');
const TriviaQuestion = require('../models/TriviaQuestion');

/**
 * POST /api/queue/join
 * Join the queue for an event
 */
router.post('/join', async (req, res) => {
  try {
    const { eventId, userId, triviaQuestionId, triviaAnswer } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Layer 2: Trivia gate — verify answer before allowing queue join
    if (!triviaQuestionId || triviaAnswer === null || triviaAnswer === undefined) {
      return res.status(403).json({ message: 'Trivia verification required.' });
    }
    const gateQuestion = await TriviaQuestion.findById(triviaQuestionId);
    if (!gateQuestion || parseInt(triviaAnswer) !== gateQuestion.correctAnswer) {
      return res.status(403).json({ message: 'Incorrect answer. Please try again.' });
    }

    // Layer 3: IP flagging — detect multiple sessions for the SAME event from one IP
    // (joining different events is normal; joining the same event many times is a bot)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const ipCount = await QueueSession.countDocuments({
      ipAddress: ip,
      eventId,
      joinedAt: { $gte: fifteenMinAgo },
      status: { $in: ['waiting', 'active'] }
    });
    const isSuspiciousIp = ipCount >= 3;

    const result = await queueManager.joinQueue(eventId, userId, ip, isSuspiciousIp);

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

/**
 * POST /api/queue/location/:sessionId
 * Save location data for a queue session
 */
router.post('/location/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { locationData } = req.body;

    if (!locationData) {
      return res.status(400).json({ error: 'Location data is required' });
    }

    // Find the session
    const session = await QueueSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get event to calculate proximity if coordinates provided
    if (locationData.userCoords) {
      const event = await Event.findById(session.eventId);
      if (event && event.coordinates && event.coordinates.lat && event.coordinates.lng) {
        // Calculate distance using Haversine formula
        const distance = haversineDistance(
          locationData.userCoords.lat,
          locationData.userCoords.lng,
          event.coordinates.lat,
          event.coordinates.lng
        );

        locationData.distanceMiles = Math.round(distance * 10) / 10;
        locationData.isLocal = distance < 50;
        locationData.isRegional = distance < 200;
        locationData.nearVenue = distance < 5;
      }
    }

    // Update session with location data
    session.locationData = {
      granted: locationData.granted || false,
      distanceMiles: locationData.distanceMiles || null,
      isLocal: locationData.isLocal || false,
      isRegional: locationData.isRegional || false,
      nearVenue: locationData.nearVenue || false,
      city: locationData.city || null,
      checkedAt: new Date()
    };

    await session.save();

    res.json({
      success: true,
      locationData: session.locationData
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Haversine formula to calculate distance between two coordinates
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;
