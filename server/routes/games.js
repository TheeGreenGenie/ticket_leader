const express = require('express');
const router = express.Router();
const GameResult = require('../models/GameResult');
const TriviaQuestion = require('../models/TriviaQuestion');
const QueueSession = require('../models/QueueSession');
const BehavioralStream = require('../models/BehavioralStream');
const trustScoreCalculator = require('../services/trustScoreCalculator');

/**
 * POST /api/games/submit
 * Submit game result and update trust score
 */
router.post('/submit', async (req, res) => {
  try {
    const { sessionId, gameType, questionId, answer, responseTime } = req.body;

    if (!sessionId || !gameType || !questionId || answer === undefined || !responseTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let isCorrect = null;
    let trustBoostEarned = 0;

    // Handle trivia game
    if (gameType === 'trivia') {
      const question = await TriviaQuestion.findById(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      isCorrect = parseInt(answer) === question.correctAnswer;
      trustBoostEarned = trustScoreCalculator.calculateTriviaBoost(
        isCorrect,
        question.difficulty,
        responseTime
      );
    }

    // Handle poll game
    if (gameType === 'poll') {
      isCorrect = null; // No right/wrong for polls
      trustBoostEarned = trustScoreCalculator.calculatePollBoost(responseTime);
    }

    // Save game result
    const gameResult = new GameResult({
      sessionId,
      gameType,
      questionId,
      userAnswer: answer,
      isCorrect,
      responseTime,
      trustBoostEarned
    });

    await gameResult.save();

    // Update session trust score
    const { trustScore, trustLevel } = await trustScoreCalculator.updateTrustScore(
      sessionId,
      trustBoostEarned
    );

    // Increment games played count
    await QueueSession.findOneAndUpdate(
      { sessionId },
      {
        $inc: { 'behavioralData.gamesPlayed': 1 },
        lastActivity: new Date()
      }
    );

    res.json({
      success: true,
      correct: isCorrect,
      trustBoostEarned,
      newTrustScore: trustScore,
      newTrustLevel: trustLevel
    });
  } catch (error) {
    console.error('Submit game error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/games/history/:sessionId
 * Get game history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const history = await GameResult.find({ sessionId })
      .sort({ playedAt: -1 })
      .limit(50);

    const session = await QueueSession.findOne({ sessionId });

    res.json({
      history,
      summary: {
        totalGames: history.length,
        triviaCorrect: history.filter(h => h.gameType === 'trivia' && h.isCorrect).length,
        triviaTotal: history.filter(h => h.gameType === 'trivia').length,
        pollsCompleted: history.filter(h => h.gameType === 'poll').length,
        currentTrustScore: session?.trustScore || 0,
        currentTrustLevel: session?.trustLevel || 'bronze'
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/games/behavior/stream
 * Stream behavioral data
 */
router.post('/behavior/stream', async (req, res) => {
  try {
    const { sessionId, events } = req.body;

    if (!sessionId || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Save behavioral events
    const behavioralEvents = events.map(event => ({
      sessionId,
      eventType: event.type,
      timestamp: new Date(event.timestamp),
      data: event.data || {},
      entropy: event.entropy || 0
    }));

    await BehavioralStream.insertMany(behavioralEvents);

    // Update session activity counters
    const updateData = { lastActivity: new Date() };

    const mouseMoves = events.filter(e => e.type === 'mouse_move').length;
    const scrolls = events.filter(e => e.type === 'scroll').length;

    if (mouseMoves > 0) {
      updateData['$inc'] = updateData['$inc'] || {};
      updateData['$inc']['behavioralData.mouseMovements'] = mouseMoves;
    }

    if (scrolls > 0) {
      updateData['$inc'] = updateData['$inc'] || {};
      updateData['$inc']['behavioralData.scrollEvents'] = scrolls;
    }

    await QueueSession.findOneAndUpdate({ sessionId }, updateData);

    res.json({ success: true, eventsReceived: events.length });
  } catch (error) {
    console.error('Behavior stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/games/trust/:sessionId
 * Get detailed trust score breakdown
 */
router.get('/trust/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await trustScoreCalculator.recalculateTrustScore(sessionId);

    res.json(result);
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/games/detect-suspicious/:sessionId
 * Detect suspicious behavior (admin/system endpoint)
 */
router.post('/detect-suspicious/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await trustScoreCalculator.detectSuspiciousBehavior(sessionId);

    res.json(result);
  } catch (error) {
    console.error('Detect suspicious error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
