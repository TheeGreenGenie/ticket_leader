import { getProximityBadge } from '../../services/locationService';
import './LocalFanBadge.css';

export default function LocalFanBadge({ locationData, showDetails = true }) {
  const badge = getProximityBadge(locationData);

  if (!badge) {
    return null;
  }

  return (
    <div
      className={`local-fan-badge badge-${badge.type}`}
      style={{ '--badge-color': badge.color }}
    >
      <span className="badge-icon">{badge.icon}</span>
      <div className="badge-content">
        <span className="badge-label">{badge.label}</span>
        {showDetails && (
          <span className="badge-description">{badge.description}</span>
        )}
      </div>
      {locationData.city && (
        <span className="badge-city">{locationData.city}</span>
      )}
    </div>
  );
}
