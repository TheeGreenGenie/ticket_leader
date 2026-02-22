import './TrustLevelBadge.css';

const TRUST_LEVELS = {
  bronze: { label: 'Bronze', color: '#CD7F32', icon: '🥉' },
  silver: { label: 'Silver', color: '#C0C0C0', icon: '🥈' },
  gold: { label: 'Gold', color: '#FFD700', icon: '🥇' },
  platinum: { label: 'Platinum', color: '#E5E4E2', icon: '💎' }
};

export default function TrustLevelBadge({ level, score, showScore = true }) {
  const trustInfo = TRUST_LEVELS[level] || TRUST_LEVELS.bronze;

  return (
    <div className="trust-badge" style={{ '--trust-color': trustInfo.color }}>
      <span className="trust-icon">{trustInfo.icon}</span>
      <div className="trust-info">
        <span className="trust-label">{trustInfo.label}</span>
        {showScore && (
          <span className="trust-score">{score}/100</span>
        )}
      </div>
      <div className="trust-bar">
        <div
          className="trust-bar-fill"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
