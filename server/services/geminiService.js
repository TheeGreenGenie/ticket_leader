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
}

// Export singleton instance
const geminiService = new GeminiService();
module.exports = geminiService;
