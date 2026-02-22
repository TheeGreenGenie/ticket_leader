import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { login, signup } from '../api/auth';
import './LoginPage.css';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleModeSwitch(newMode) {
    setMode(newMode);
    setError('');
    setForm({ name: '', email: '', password: '' });
    recaptchaRef.current?.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      setError('Please complete the CAPTCHA.');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await login(form.email, form.password, captchaToken);
      } else {
        data = await signup(form.name, form.email, form.password, captchaToken);
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.name || form.name);
      navigate('/live-queue');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Server unavailable. Please try again later.';
      setError(msg);
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Hero Section */}
      <section className="login-hero">
        <div className="hero-content">
          <div className="hero-logo">
            <span className="logo-icon">TL</span>
          </div>
          <h1 className="hero-title">
            <span className="text-gradient">TicketLeader</span>
          </h1>
          <p className="hero-subtitle">
            The future of fair ticket purchasing.<br />
            Skip the bots. Join the queue.
          </p>

          {/* Floating particles for visual effect */}
          <div className="hero-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
      </section>

      {/* Auth Section */}
      <section className="login-auth">
        <div className="auth-container">
          {!mode ? (
            <div className="auth-welcome animate-fade-in">
              <h2>Welcome</h2>
              <p>Get access to exclusive events and secure your tickets with our gamified queue system.</p>

              <div className="auth-buttons">
                <button
                  className="btn-auth btn-auth-primary"
                  onClick={() => handleModeSwitch('login')}
                >
                  Sign In
                </button>
                <button
                  className="btn-auth btn-auth-secondary"
                  onClick={() => handleModeSwitch('signup')}
                >
                  Create Account
                </button>
              </div>

              <div className="auth-features">
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Fair Queue System</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🤖</span>
                  <span>Bot-Free Experience</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎮</span>
                  <span>Gamified Waiting</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-form-container animate-slide-up">
              <button className="btn-back" onClick={() => setMode(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p>{mode === 'login' ? 'Sign in to access your tickets and events.' : 'Join the waitlist revolution today.'}</p>

              <form className="auth-form" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} />
                </div>

                {error && (
                  <div className="form-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <p className="auth-switch">
                {mode === 'login' ? (
                  <>Don't have an account? <button onClick={() => handleModeSwitch('signup')}>Sign up</button></>
                ) : (
                  <>Already have an account? <button onClick={() => handleModeSwitch('login')}>Sign in</button></>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="login-footer">
        <p>&copy; 2026 TicketLeader. All rights reserved.</p>
      </footer>
    </div>
  );
}
