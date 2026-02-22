const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Event = require('../models/Event');
const TriviaQuestion = require('../models/TriviaQuestion');
const PollQuestion = require('../models/PollQuestion');
const geminiService = require('../services/geminiService');

// Initialize Gemini service
geminiService.initialize();

/**
 * GET /api/content/artists
 * Get all artists
 */
router.get('/artists', async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    res.json(artists);
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

/**
 * GET /api/content/artists/:artistId
 * Get artist by ID
 */
router.get('/artists/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(artist);
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

/**
 * GET /api/content/artists/:artistId/trivia
 * Get trivia questions for an artist (supports AI generation)
 * Query params:
 *   - limit: number of questions (default 10)
 *   - difficulty: easy|medium|hard|mixed (default mixed for AI)
 *   - useAI: true|false (default true if Gemini available)
 */
const TRIVIA_POOL_SIZE = 15;

/**
 * Ensure the DB has at least TRIVIA_POOL_SIZE questions for an artist.
 * Calls Gemini only when the pool is thin. Safe to call fire-and-forget.
 */
async function ensureTriviaPool(artistId) {
  if (!geminiService.isAvailable()) return;
  try {
    const existingCount = await TriviaQuestion.countDocuments({ artistId });
    if (existingCount >= TRIVIA_POOL_SIZE) return; // pool is healthy

    const artist = await Artist.findById(artistId);
    if (!artist) return;

    const needed = TRIVIA_POOL_SIZE - existingCount;
    const aiQuestions = await geminiService.generateTrivia(artist.name, needed, 'mixed');

    // Dedup by question text before inserting
    const existingTexts = new Set(
      (await TriviaQuestion.find({ artistId }, 'question')).map(q => q.question)
    );
    const newDocs = aiQuestions
      .filter(q => !existingTexts.has(q.question))
      .map(q => ({
        artistId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || 'medium',
        category: q.category || 'general',
        trustBoost: q.trustBoost || 5,
      }));
    if (newDocs.length > 0) {
      await TriviaQuestion.insertMany(newDocs);
      console.log(`Seeded ${newDocs.length} trivia questions for artist ${artistId}`);
    }
  } catch (err) {
    console.warn('ensureTriviaPool failed:', err.message);
  }
}

router.get('/artists/:artistId/trivia', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { limit = 5, difficulty, useAI = 'true', exclude = '' } = req.query;
    const requestedLimit = parseInt(limit);

    if (useAI === 'true') {
      await ensureTriviaPool(artistId);
    } else {
      ensureTriviaPool(artistId).catch(() => {});
    }

    const query = { artistId };
    if (difficulty && difficulty !== 'mixed') {
      query.difficulty = difficulty;
    }

    // Parse excluded IDs sent by the client (recently seen questions)
    const excludeIds = exclude
      ? exclude.split(',').filter(id => id.match(/^[a-f\d]{24}$/i))
      : [];

    let questions = await TriviaQuestion.find(query);

    // Prefer unseen questions; fall back to full pool if not enough remain
    const unseen = questions.filter(q => !excludeIds.includes(q._id.toString()));
    const pool = unseen.length >= requestedLimit ? unseen : questions;

    const shuffled = pool.sort(() => Math.random() - 0.5);
    res.json(shuffled.slice(0, requestedLimit));
  } catch (error) {
    console.error('Get trivia error:', error);
    res.status(500).json({ error: 'Failed to fetch trivia questions' });
  }
});

/**
 * GET /api/content/artists/:artistId/trivia/generate
 * Force generate fresh AI trivia questions (bypasses cache option)
 */
router.get('/artists/:artistId/trivia/generate', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { count = 5, difficulty = 'mixed', fresh = 'false' } = req.query;

    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        error: 'AI trivia generation not available',
        fallback: true
      });
    }

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Clear cache if fresh questions requested
    if (fresh === 'true') {
      geminiService.clearCache();
    }

    const questions = await geminiService.generateTrivia(
      artist.name,
      parseInt(count),
      difficulty
    );

    res.json(questions.map(q => ({ ...q, artistId })));
  } catch (error) {
    console.error('Generate trivia error:', error);

    // Fallback to static questions
    try {
      const staticQuestions = await TriviaQuestion.find({ artistId: req.params.artistId })
        .limit(parseInt(req.query.count) || 5);

      if (staticQuestions.length > 0) {
        console.log('Returning static fallback questions');
        return res.json(staticQuestions);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    res.status(500).json({ error: 'Failed to generate trivia questions' });
  }
});

/**
 * GET /api/content/artists/:artistId/polls
 * Get poll questions for an artist (randomized)
 */
router.get('/artists/:artistId/polls', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { limit = 5 } = req.query;

    const questions = await PollQuestion.find({ artistId });

    // Randomize questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, parseInt(limit));

    res.json(limited);
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to fetch poll questions' });
  }
});

/**
 * GET /api/content/artists/:artistId/trivia/local
 * Get location-themed trivia about an artist's connection to a fan's city
 * Query params:
 *   - city: fan's city (required)
 *   - count: number of questions (default 2)
 */
router.get('/artists/:artistId/trivia/local', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { city, count = 2 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        error: 'AI trivia generation not available',
        fallback: true
      });
    }

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    try {
      const questions = await geminiService.generateLocalTrivia(
        artist.name,
        city,
        parseInt(count)
      );

      res.json(questions.map(q => ({ ...q, artistId })));
    } catch (aiError) {
      console.warn('Local trivia generation failed:', aiError.message);

      // Fall back to regular trivia if local generation fails
      const regularTrivia = await geminiService.generateTrivia(
        artist.name,
        parseInt(count),
        'medium'
      );

      res.json(regularTrivia.map(q => ({ ...q, artistId, isFallback: true })));
    }
  } catch (error) {
    console.error('Get local trivia error:', error);
    res.status(500).json({ error: 'Failed to fetch local trivia questions' });
  }
});

/**
 * GET /api/content/events
 * Get all active events
 */
router.get('/events', async (req, res) => {
  try {
    const { active = 'true' } = req.query;

    const query = {};
    if (active === 'true') {
      query.isActive = true;
      query.date = { $gte: new Date() }; // Future events only
    }

    const events = await Event.find(query)
      .populate('artistId')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/content/events/:eventId
 * Get event by ID
 */
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('artistId');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

module.exports = router;
