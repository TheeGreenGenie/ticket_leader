import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './VerifyPage.css';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/live-queue';

  const [status, setStatus] = useState('checking'); // 'checking' | 'idle' | 'pending' | 'unavailable'

  useEffect(() => {
    async function checkBiometric() {
      try {
        if (!window.PublicKeyCredential) {
          setStatus('unavailable');
          setTimeout(() => navigate('/blocked'), 3000);
          return;
        }
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setStatus(available ? 'idle' : 'unavailable');
        if (!available) {
          setTimeout(() => navigate('/blocked'), 3000);
        }
      } catch {
        setStatus('unavailable');
        setTimeout(() => navigate('/blocked'), 3000);
      }
    }
    checkBiometric();
  }, [navigate]);

  async function handleVerify() {
    setStatus('pending');
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      // Use the current host for RP ID.
      const rpId = window.location.hostname;

      await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'TicketLeader',
            id: rpId
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: 'user@ticketleader.com',
            displayName: 'Identity Verification'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },   // ES256
            { type: 'public-key', alg: -257 }   // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      // Biometric passed
      localStorage.setItem('biometric_verified', Date.now().toString());
      navigate(returnTo);
    } catch (err) {
      console.error('Biometric error:', err.name, err.message);
      navigate('/blocked');
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-icon">
          {status === 'unavailable' ? '⚠️' : '🔐'}
        </div>

        <h1 className="verify-title">Identity Verification Required</h1>

        <p className="verify-subtitle">
          Our system detected unusual activity from your session. Please verify your identity to continue.
        </p>

        {status === 'checking' && (
          <div className="verify-loading">
            <div className="spinner spinner-sm" />
            <p>Checking biometric availability...</p>
          </div>
        )}

        {status === 'idle' && (
          <>
            <div className="verify-info">
              <div className="verify-info-item">
                <span className="verify-info-icon">👆</span>
                <span>Touch ID / Face ID / Windows Hello</span>
              </div>
              <div className="verify-info-item">
                <span className="verify-info-icon">🔒</span>
                <span>Your biometric data never leaves your device</span>
              </div>
            </div>

            <button
              className="verify-btn"
              onClick={handleVerify}
              disabled={status === 'pending'}
            >
              Verify with Biometrics
            </button>
          </>
        )}

        {status === 'pending' && (
          <div className="verify-loading">
            <div className="spinner spinner-sm" />
            <p>Waiting for biometric confirmation...</p>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="verify-unavailable">
            <p>Biometric authentication is not available on this device.</p>
            <p className="verify-redirect-notice">Redirecting in 3 seconds...</p>
          </div>
        )}

        <p className="verify-warning">
          Failing verification will block access to this service.
        </p>
      </div>
    </div>
  );
}


