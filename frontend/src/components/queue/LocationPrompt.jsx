import { useState } from 'react';
import { isGeolocationSupported } from '../../services/locationService';
import './LocationPrompt.css';

export default function LocationPrompt({ onLocationGranted, onDismiss }) {
  const [loading, setLoading] = useState(false);

  if (!isGeolocationSupported()) {
    return null;
  }

  const handleShareLocation = async () => {
    setLoading(true);
    try {
      // This will trigger the browser's location permission dialog
      await onLocationGranted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-prompt">
      <div className="location-prompt-icon">📍</div>
      <div className="location-prompt-content">
        <h3>Personalize Your Experience</h3>
        <p>
          Share your location to unlock local fan badges and personalized trivia
          about {`{artist}`}'s connection to your city!
        </p>
        <ul className="location-benefits">
          <li>🏠 Get a "Local Fan" badge if you're nearby</li>
          <li>🎯 Play trivia about concerts in your area</li>
          <li>📍 See venue info if you're close</li>
        </ul>
      </div>
      <div className="location-prompt-actions">
        <button
          className="btn-location-share"
          onClick={handleShareLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-sm"></span>
              Checking...
            </>
          ) : (
            <>
              <span className="btn-icon">📍</span>
              Share Location
            </>
          )}
        </button>
        <button className="btn-location-skip" onClick={onDismiss}>
          Maybe Later
        </button>
      </div>
      <p className="location-privacy">
        Your location is only used during this session and is never stored permanently.
      </p>
    </div>
  );
}
