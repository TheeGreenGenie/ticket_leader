import { useEffect } from 'react';
import './BlockedPage.css';

export default function BlockedPage() {
  useEffect(() => {
    // Clear all session data — this user is blocked
    localStorage.clear();
  }, []);

  return (
    <div className="blocked-page">
      <div className="blocked-content">
        <div className="blocked-icon">🚫</div>

        <div className="blocked-code">Error 403</div>

        <h1 className="blocked-title">Access Denied</h1>

        <p className="blocked-message">
          Suspicious activity was detected from your session.
          You have been blocked from accessing this service.
        </p>

        <div className="blocked-divider" />

        <p className="blocked-detail">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
