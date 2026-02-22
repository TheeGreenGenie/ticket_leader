# Google Gemini API Integration Plan

## Overview
Replace static JSON trivia questions with dynamically generated questions using Google Gemini API. This creates infinite, unique questions that bots cannot pre-scrape.

---

## Phase 1: Setup & Configuration

### 1.1 Install Dependencies
```bash
cd server
npm install @google/generative-ai
```

### 1.2 Environment Variables
Add to `server/.env`:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # Fast and cost-effective for trivia
```

### 1.3 Get API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env` file

---

## Phase 2: Create Gemini Service

### 2.1 New File: `server/services/geminiService.js`

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
    this.cache = new Map(); // In-memory cache
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async generateTrivia(artistName, count = 5, difficulty = 'mixed') {
    const cacheKey = `${artistName}-${count}-${difficulty}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const prompt = this.buildTriviaPrompt(artistName, count, difficulty);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      const questions = this.parseQuestions(text, artistName);

      // Cache the results
      this.setCache(cacheKey, questions);

      return questions;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  buildTriviaPrompt(artistName, count, difficulty) {
    const difficultyInstructions = difficulty === 'mixed'
      ? 'Mix difficulties: include 2 easy, 2 medium, and 1 hard question.'
      : `All questions should be ${difficulty} difficulty.`;

    return `Generate ${count} multiple-choice trivia questions about ${artistName} for fans waiting to buy concert tickets.

${difficultyInstructions}

Requirements:
- Include questions about: albums, tours, hit songs, collaborations, awards, personal facts, fan culture, recent news
- Each question must have exactly 4 options
- Questions should be engaging and test real fan knowledge
- Avoid controversial or sensitive topics
- Make questions specific enough that they can't be guessed

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
[
  {
    "question": "What was the name of Taylor Swift's first studio album?",
    "options": ["Taylor Swift", "Fearless", "Speak Now", "Red"],
    "correct_index": 0,
    "difficulty": "easy",
    "category": "albums"
  }
]

Categories to use: albums, tours, songs, collaborations, awards, personal, fan_culture, recent_news`;
  }

  parseQuestions(text, artistName) {
    // Remove any markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(cleaned);

    // Transform to match our schema
    return parsed.map((q, index) => ({
      _id: `gemini-${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_index,
      difficulty: q.difficulty || 'medium',
      category: q.category || 'general',
      trustBoost: this.getTrustBoost(q.difficulty),
      isGenerated: true,
      artistName: artistName
    }));
  }

  getTrustBoost(difficulty) {
    const boosts = { easy: 2, medium: 5, hard: 10 };
    return boosts[difficulty] || 5;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new GeminiService();
```

---

## Phase 3: Update Content Routes

### 3.1 Modify `server/routes/content.js`

Add a new endpoint for AI-generated trivia:

```javascript
const geminiService = require('../services/geminiService');

/**
 * GET /api/content/artists/:artistId/trivia/generate
 * Generate fresh trivia questions using Gemini AI
 */
router.get('/artists/:artistId/trivia/generate', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { count = 5, difficulty = 'mixed' } = req.query;

    // Get artist name for prompt
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Generate questions with Gemini
    const questions = await geminiService.generateTrivia(
      artist.name,
      parseInt(count),
      difficulty
    );

    // Add artistId to each question for consistency
    const enriched = questions.map(q => ({
      ...q,
      artistId: artistId
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Generate trivia error:', error);

    // Fallback to static questions on API failure
    const staticQuestions = await TriviaQuestion.find({ artistId })
      .limit(parseInt(req.query.count) || 5);

    if (staticQuestions.length > 0) {
      console.log('Falling back to static questions');
      res.json(staticQuestions);
    } else {
      res.status(500).json({ error: 'Failed to generate trivia questions' });
    }
  }
});
```

### 3.2 Update Existing Trivia Endpoint (Hybrid Mode)

Modify the existing `/trivia` endpoint to optionally use Gemini:

```javascript
router.get('/artists/:artistId/trivia', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { limit = 10, difficulty, useAI = 'false' } = req.query;

    // If AI mode requested and API key exists
    if (useAI === 'true' && process.env.GEMINI_API_KEY) {
      const artist = await Artist.findById(artistId);
      if (artist) {
        try {
          const aiQuestions = await geminiService.generateTrivia(
            artist.name,
            parseInt(limit),
            difficulty || 'mixed'
          );
          return res.json(aiQuestions.map(q => ({ ...q, artistId })));
        } catch (aiError) {
          console.warn('AI generation failed, falling back to static:', aiError.message);
        }
      }
    }

    // Static questions (original behavior)
    const query = { artistId };
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await TriviaQuestion.find(query);
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, parseInt(limit));

    res.json(limited);
  } catch (error) {
    console.error('Get trivia error:', error);
    res.status(500).json({ error: 'Failed to fetch trivia questions' });
  }
});
```

---

## Phase 4: Frontend Updates

### 4.1 Update API Client `frontend/src/api/content.js`

```javascript
export const getTrivia = async (artistId, options = {}) => {
  const { limit = 10, difficulty, useAI = true } = options;
  const params = new URLSearchParams({
    limit: limit.toString(),
    useAI: useAI.toString()
  });
  if (difficulty) params.append('difficulty', difficulty);

  const response = await api.get(`/content/artists/${artistId}/trivia?${params}`);
  return response.data;
};

// New function for explicitly requesting AI generation
export const generateTrivia = async (artistId, count = 5, difficulty = 'mixed') => {
  const params = new URLSearchParams({ count: count.toString(), difficulty });
  const response = await api.get(`/content/artists/${artistId}/trivia/generate?${params}`);
  return response.data;
};
```

### 4.2 Update LiveQueuePage to Use AI Trivia

In the trivia loading section:
```javascript
const loadTrivia = async () => {
  try {
    // Try AI-generated questions first
    const questions = await getTrivia(event.artistId._id, {
      limit: 5,
      useAI: true
    });
    setTriviaQuestions(questions);
  } catch (error) {
    console.error('Failed to load trivia:', error);
  }
};
```

---

## Phase 5: Caching Strategy

### 5.1 Redis Caching (Optional - For Production)

For production, replace in-memory cache with Redis:

```javascript
// server/services/cacheService.js
const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, data, ttlSeconds = 1800) {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }
}
```

### 5.2 Caching Rules
- Cache generated questions for 30 minutes per artist
- Different cache keys for different difficulty levels
- Clear cache when new artist data is updated
- Rate limit: Max 10 generations per minute per IP

---

## Phase 6: Rate Limiting & Error Handling

### 6.1 Add Rate Limiting to Gemini Endpoint

```javascript
const rateLimit = require('express-rate-limit');

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many requests, please try again later' }
});

router.get('/artists/:artistId/trivia/generate', geminiLimiter, async (req, res) => {
  // ... existing code
});
```

### 6.2 Graceful Fallback Chain
1. Try Gemini API
2. On failure → Return cached questions if available
3. On cache miss → Return static DB questions
4. On empty DB → Return error with helpful message

---

## Phase 7: Testing

### 7.1 Manual Testing
```bash
# Test AI generation
curl "http://127.0.0.1:5001/api/content/artists/{artistId}/trivia/generate?count=3"

# Test hybrid mode
curl "http://127.0.0.1:5001/api/content/artists/{artistId}/trivia?useAI=true&limit=5"

# Test fallback (without API key)
curl "http://127.0.0.1:5001/api/content/artists/{artistId}/trivia?useAI=true"
```

### 7.2 Unit Tests
- Test prompt generation
- Test JSON parsing
- Test cache expiry
- Test fallback logic

---

## Implementation Order

1. **Install SDK** - `npm install @google/generative-ai`
2. **Set up API key** - Add to `.env`
3. **Create geminiService.js** - Core AI logic
4. **Update content routes** - Add `/generate` endpoint
5. **Update frontend API** - Add `useAI` option
6. **Test end-to-end** - Verify questions appear in UI
7. **Add rate limiting** - Protect API costs
8. **Monitor & optimize** - Track usage and cache hits

---

## Cost Considerations

- Gemini 1.5 Flash: Very cost-effective (~$0.00025 per 1K input tokens)
- Each trivia request: ~200 input tokens, ~500 output tokens
- Estimated cost: ~$0.0005 per request
- With caching: Much lower actual costs

---

## Security Notes

- Never expose GEMINI_API_KEY to frontend
- Validate artistId exists before making API calls
- Sanitize artist names to prevent prompt injection
- Rate limit to prevent abuse

