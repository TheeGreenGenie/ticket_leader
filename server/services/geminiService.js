const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  initialize() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set - AI trivia generation disabled');
      return false;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    console.log('Gemini AI service initialized');
    return true;
  }

  isAvailable() {
    return this.model !== null;
  }

  async generateTrivia(artistName, count = 5, difficulty = 'mixed') {
    if (!this.isAvailable()) {
      throw new Error('Gemini service not initialized');
    }

    // Check cache first
    const cacheKey = `trivia-${artistName}-${count}-${difficulty}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Returning cached trivia for ${artistName}`);
      return cached;
    }

    const prompt = this.buildTriviaPrompt(artistName, count, difficulty);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.parseQuestions(text, artistName);

      // Cache the results
      this.setCache(cacheKey, questions);

      console.log(`Generated ${questions.length} trivia questions for ${artistName}`);
      return questions;
    } catch (error) {
      console.error('Gemini API error:', error.message);
      throw error;
    }
  }

  buildTriviaPrompt(artistName, count, difficulty) {
    const difficultyInstructions = difficulty === 'mixed'
      ? 'Mix difficulties: include easy, medium, and hard questions in roughly equal proportions.'
      : `All questions should be ${difficulty} difficulty.`;

    return `Generate ${count} multiple-choice trivia questions about ${artistName} for fans waiting to buy concert tickets.

${difficultyInstructions}

Requirements:
- Include questions about: albums, tours, hit songs, collaborations, awards, personal facts, fan culture, recent news
- Each question must have exactly 4 options
- Questions should be engaging and test real fan knowledge
- Avoid controversial or sensitive topics
- Make questions specific enough that they can't be easily guessed
- Ensure correct_index is a number between 0 and 3

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, no extra text):
[
  {
    "question": "What was the name of the artist's debut album?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
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

    // Try to extract JSON array if there's extra text
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

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
    console.log('Gemini cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate location-themed trivia about an artist's connection to a specific city
   * @param {string} artistName - The artist's name
   * @param {string} fanCity - The fan's city
   * @param {number} count - Number of questions (default 2)
   * @returns {Promise<Array>} Array of trivia questions
   */
  async generateLocalTrivia(artistName, fanCity, count = 2) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service not initialized');
    }

    // Use shorter cache for local trivia (15 minutes)
    const cacheKey = `local-trivia-${artistName}-${fanCity}-${count}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Returning cached local trivia for ${artistName} in ${fanCity}`);
      return cached;
    }

    const prompt = this.buildLocalTriviaPrompt(artistName, fanCity, count);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.parseLocalQuestions(text, artistName, fanCity);

      // Cache the results (shorter TTL for local trivia)
      this.setCache(cacheKey, questions);

      console.log(`Generated ${questions.length} local trivia questions for ${artistName} in ${fanCity}`);
      return questions;
    } catch (error) {
      console.error('Gemini local trivia error:', error.message);
      throw error;
    }
  }

  buildLocalTriviaPrompt(artistName, fanCity, count) {
    return `Generate ${count} trivia questions about ${artistName}'s connection to ${fanCity}.

Focus on:
- Past concerts or tours that stopped in ${fanCity}
- Shoutouts to ${fanCity} in songs or interviews
- Local collaborations with artists from ${fanCity}
- Memorable moments at ${fanCity} venues
- If the artist is FROM ${fanCity}, include hometown facts

If ${artistName} has no strong connection to ${fanCity}:
- Ask about the CLOSEST major city the artist has performed in
- Or ask about the artist's connection to the broader region/state

Requirements:
- Each question must have exactly 4 options
- Questions should feel personal and localized
- Make the fan feel special for being from ${fanCity}
- Ensure correct_index is a number between 0 and 3

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
[
  {
    "question": "What year did ${artistName} last perform in ${fanCity}?",
    "options": ["2019", "2020", "2021", "2022"],
    "correct_index": 2,
    "difficulty": "medium",
    "local_context": "Brief note about why this is relevant to the city"
  }
]`;
  }

  parseLocalQuestions(text, artistName, fanCity) {
    // Remove any markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    // Try to extract JSON array if there's extra text
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Transform to match our schema with local-specific fields
    return parsed.map((q, index) => ({
      _id: `gemini-local-${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_index,
      difficulty: q.difficulty || 'medium',
      category: 'local',
      trustBoost: 8, // Bonus points for local trivia
      isGenerated: true,
      isLocalTrivia: true,
      artistName: artistName,
      fanCity: fanCity,
      localContext: q.local_context || null
    }));
  }
}

// Export singleton instance
const geminiService = new GeminiService();
module.exports = geminiService;
