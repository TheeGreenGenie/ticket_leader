const QueueSession = require('../models/QueueSession');
const GameResult = require('../models/GameResult');
const BehavioralStream = require('../models/BehavioralStream');

class TrustScoreCalculator {
  /**
   * Calculate trust boost for a trivia answer
   */
  calculateTriviaBoost(isCorrect, difficulty, responseTime) {
    if (!isCorrect) {
      return 0;
    }

    // Base boost by difficulty
    let boost = 0;
    switch (difficulty) {
      case 'easy':
        boost = 5;
        break;
      case 'medium':
        boost = 10;
        break;
      case 'hard':
        boost = 15;
        break;
    }

    // Penalize if response is too fast (potential bot)
    if (responseTime < 1000) {
      boost = Math.max(0, boost - 5); // Suspicious fast response
    }

    // Bonus for thoughtful response time (2-8 seconds)
    if (responseTime >= 2000 && responseTime <= 8000) {
      boost += 2;
    }

    return boost;
  }

  /**
   * Calculate trust boost for poll participation
   */
  calculatePollBoost(responseTime) {
    let boost = 3; // Base participation boost

    // Penalize instant responses
    if (responseTime < 500) {
      boost = 1;
    }

    // Bonus for thoughtful engagement
    if (responseTime >= 2000 && responseTime <= 10000) {
      boost += 2;
    }

    return boost;
  }

  /**
   * Calculate behavioral consistency score
   */
  async calculateBehavioralScore(sessionId) {
    const events = await BehavioralStream.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(100);

    if (events.length < 10) {
      return 0; // Not enough data
    }

    let score = 0;

    // Check for mouse movement variance
    const mouseMoves = events.filter(e => e.eventType === 'mouse_move');
    if (mouseMoves.length > 5) {
      const avgEntropy = mouseMoves.reduce((sum, e) => sum + (e.entropy || 0), 0) / mouseMoves.length;

      // Higher entropy = more human-like
      if (avgEntropy > 0.5) {
        score += 10;
      } else if (avgEntropy > 0.3) {
        score += 5;
      } else {
        score -= 5; // Very low entropy = suspicious
      }
    }

    // Check for scroll behavior
    const scrolls = events.filter(e => e.eventType === 'scroll');
    if (scrolls.length > 3) {
      score += 5;
    }

    // Check for click patterns
    const clicks = events.filter(e => e.eventType === 'click');
    if (clicks.length > 0 && clicks.length < 50) {
      score += 5;
    } else if (clicks.length >= 50) {
      score -= 5; // Too many clicks = suspicious
    }

    return Math.max(-10, Math.min(10, score));
  }

  /**
   * Calculate time-based trust boost
   */
  calculateTimeBoost(joinedAt) {
    const timeSpent = Date.now() - new Date(joinedAt).getTime();
    const minutesSpent = timeSpent / (1000 * 60);

    // +1 per minute, max +20
    return Math.min(20, Math.floor(minutesSpent));
  }

  /**
   * Update trust score for a session after game submission
   */
  async updateTrustScore(sessionId, boost) {
    const session = await QueueSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    // Apply boost
    session.trustScore = Math.max(0, Math.min(100, session.trustScore + boost));

    // Update trust level based on new score
    session.updateTrustLevel();

    // Update last activity
    session.lastActivity = new Date();

    await session.save();

    return {
      trustScore: session.trustScore,
      trustLevel: session.trustLevel
    };
  }

  /**
   * Comprehensive trust score recalculation
   */
  async recalculateTrustScore(sessionId) {
    const session = await QueueSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    let totalScore = 50; // Base score

    // Game performance
    const gameResults = await GameResult.find({ sessionId });
    for (const result of gameResults) {
      totalScore += result.trustBoostEarned;
    }

    // Behavioral analysis
    const behavioralScore = await this.calculateBehavioralScore(sessionId);
    totalScore += behavioralScore;

    // Time spent
    const timeBoost = this.calculateTimeBoost(session.joinedAt);
    totalScore += timeBoost;

    // Clamp to 0-100
    session.trustScore = Math.max(0, Math.min(100, totalScore));
    session.updateTrustLevel();
    session.lastActivity = new Date();

    await session.save();

    return {
      trustScore: session.trustScore,
      trustLevel: session.trustLevel,
      breakdown: {
        base: 50,
        games: gameResults.reduce((sum, r) => sum + r.trustBoostEarned, 0),
        behavioral: behavioralScore,
        timeSpent: timeBoost
      }
    };
  }

  /**
   * Detect suspicious behavior patterns
   */
  async detectSuspiciousBehavior(sessionId) {
    const session = await QueueSession.findOne({ sessionId });
    const gameResults = await GameResult.find({ sessionId });
    const behavioralEvents = await BehavioralStream.find({ sessionId });

    const flags = [];

    // Check for instant responses
    const fastResponses = gameResults.filter(r => r.responseTime < 500);
    if (fastResponses.length > 3) {
      flags.push('Multiple instant responses');
    }

    // Check for no mouse movement
    const mouseMoves = behavioralEvents.filter(e => e.eventType === 'mouse_move');
    if (gameResults.length > 0 && mouseMoves.length === 0) {
      flags.push('No mouse movement detected');
    }

    // Check for perfect scores with fast times
    const correctAnswers = gameResults.filter(r => r.isCorrect);
    if (correctAnswers.length > 5) {
      const avgResponseTime = correctAnswers.reduce((sum, r) => sum + r.responseTime, 0) / correctAnswers.length;
      if (avgResponseTime < 1500) {
        flags.push('Perfect accuracy with suspiciously fast responses');
      }
    }

    // Apply penalty if flags detected
    if (flags.length > 0) {
      session.trustScore = Math.max(0, session.trustScore - (flags.length * 10));
      session.updateTrustLevel();
      await session.save();
    }

    return {
      suspicious: flags.length > 0,
      flags,
      newTrustScore: session.trustScore
    };
  }
}

module.exports = new TrustScoreCalculator();
