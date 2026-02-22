const QueueSession = require('../models/QueueSession');
const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

class QueueManager {
  /**
   * Add a user to the queue for an event
   */
  async joinQueue(eventId, userId = null, ip = null, isSuspiciousIp = false) {
    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    if (!event.isActive) {
      throw new Error('Event queue is not active');
    }

    // Check capacity
    if (event.currentQueueSize >= event.queueCapacity) {
      throw new Error('Queue is at capacity');
    }

    // Check if user already in queue for this event (only if valid userId)
    if (userId && userId !== 'null' && userId !== 'undefined') {
      const existing = await QueueSession.findOne({
        userId,
        eventId,
        status: 'waiting'
      });
      if (existing) {
        return {
          sessionId: existing.sessionId,
          position: existing.currentPosition,
          estimatedWait: this.calculateEstimatedWait(existing.currentPosition)
        };
      }
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Get current queue size for this event
    const currentPosition = event.currentQueueSize + 1;

    // Create queue session (only include userId if valid)
    const sessionData = {
      sessionId,
      eventId,
      currentPosition,
      trustScore: 50,
      trustLevel: 'silver',
      status: 'waiting',
      ipAddress: ip
    };

    if (userId && userId !== 'null' && userId !== 'undefined') {
      sessionData.userId = userId;
    }

    const session = new QueueSession(sessionData);

    await session.save();

    // Apply IP flag penalty if suspicious
    if (isSuspiciousIp) {
      session.isFlagged = true;
      session.flagReasons.push('Multiple sessions from same IP in 15 minutes');
      session.trustScore = Math.max(0, session.trustScore - 20);
      session.updateTrustLevel();
      await session.save();
    }

    // Update event queue size
    event.currentQueueSize += 1;
    await event.save();

    return {
      sessionId,
      position: currentPosition,
      estimatedWait: this.calculateEstimatedWait(currentPosition),
      trustScore: session.trustScore,
      trustLevel: session.trustLevel,
      isFlagged: session.isFlagged
    };
  }

  /**
   * Get queue status for a session
   */
  async getQueueStatus(sessionId) {
    const session = await QueueSession.findOne({ sessionId }).populate('eventId');
    if (!session) {
      throw new Error('Session not found');
    }

    const event = session.eventId;

    return {
      sessionId: session.sessionId,
      position: session.currentPosition,
      queueSize: event.currentQueueSize,
      estimatedWait: this.calculateEstimatedWait(session.currentPosition),
      trustScore: session.trustScore,
      trustLevel: session.trustLevel,
      status: session.status,
      event: {
        name: event.eventName,
        venue: event.venue,
        date: event.date
      }
    };
  }

  /**
   * Remove a user from the queue
   */
  async leaveQueue(sessionId) {
    const session = await QueueSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const event = await Event.findById(session.eventId);

    // Mark session as completed
    session.status = 'expired';
    await session.save();

    // Update positions for users behind this one
    await QueueSession.updateMany(
      {
        eventId: session.eventId,
        currentPosition: { $gt: session.currentPosition },
        status: 'waiting'
      },
      {
        $inc: { currentPosition: -1 }
      }
    );

    // Update event queue size
    if (event) {
      event.currentQueueSize = Math.max(0, event.currentQueueSize - 1);
      await event.save();
    }

    return { success: true };
  }

  /**
   * Update queue positions based on trust scores (periodic reordering)
   */
  async reorderQueueByTrust(eventId) {
    const sessions = await QueueSession.find({
      eventId,
      status: 'waiting'
    }).sort({ trustScore: -1, joinedAt: 1 });

    // Reassign positions based on trust score
    let position = 1;
    for (const session of sessions) {
      session.currentPosition = position;
      await session.save();
      position++;
    }

    return sessions.length;
  }

  /**
   * Advance queue (simulate ticket purchase completion)
   */
  async advanceQueue(eventId, count = 1) {
    // Get sessions at the front
    const sessions = await QueueSession.find({
      eventId,
      status: 'waiting'
    })
      .sort({ currentPosition: 1 })
      .limit(count);

    for (const session of sessions) {
      session.status = 'active';
      await session.save();
    }

    // Update positions for remaining sessions
    await QueueSession.updateMany(
      {
        eventId,
        currentPosition: { $gt: count },
        status: 'waiting'
      },
      {
        $inc: { currentPosition: -count }
      }
    );

    const event = await Event.findById(eventId);
    if (event) {
      event.currentQueueSize = Math.max(0, event.currentQueueSize - count);
      await event.save();
    }

    return sessions.map(s => s.sessionId);
  }

  /**
   * Calculate estimated wait time based on position
   * Assumes ~30 seconds per person ahead
   */
  calculateEstimatedWait(position) {
    const secondsPerPerson = 30;
    const totalSeconds = (position - 1) * secondsPerPerson;
    const minutes = Math.ceil(totalSeconds / 60);

    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 1 && remainingMinutes === 0) return '1 hour';
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Clean up expired sessions (older than 2 hours)
   */
  async cleanupExpiredSessions() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await QueueSession.deleteMany({
      lastActivity: { $lt: twoHoursAgo },
      status: { $in: ['expired', 'completed'] }
    });

    return result.deletedCount;
  }
}

module.exports = new QueueManager();
