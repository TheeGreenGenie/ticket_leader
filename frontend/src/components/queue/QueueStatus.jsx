import TrustLevelBadge from './TrustLevelBadge';
import './QueueStatus.css';

export default function QueueStatus({
  position,
  queueSize,
  estimatedWait,
  trustScore,
  trustLevel,
  event
}) {
  const progressPercent = queueSize > 0
    ? Math.max(5, 100 - (position / queueSize) * 100)
    : 5;

  return (
    <div className="queue-status">
      <div className="queue-header">
        <h2 className="event-name">{event?.name || 'Live Queue'}</h2>
        <p className="event-details">
          {event?.venue} {event?.date && `• ${new Date(event.date).toLocaleDateString()}`}
        </p>
      </div>

      <div className="queue-position-container">
        <div className="position-display">
          <span className="position-label">Your Position</span>
          <span className="position-number">#{position}</span>
          <span className="position-total">of {queueSize} in queue</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="wait-time">
          <span className="wait-icon">⏱️</span>
          <span className="wait-text">Estimated wait: {estimatedWait}</span>
        </div>
      </div>

      <div className="trust-container">
        <TrustLevelBadge level={trustLevel} score={trustScore} />
        <p className="trust-hint">
          Play games to boost your trust level and move up in the queue!
        </p>
      </div>
    </div>
  );
}
