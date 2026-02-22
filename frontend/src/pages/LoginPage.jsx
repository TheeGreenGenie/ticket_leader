import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, signup } from '../api/auth';
import ticketLogo from '../assets/ticket.PNG';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleModeSwitch(newMode) {
    setMode(newMode);
    setError('');
    setForm({ name: '', email: '', password: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await login(form.email, form.password);
      } else {
        data = await signup(form.name, form.email, form.password);
      }
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Server unavailable. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Top brand bar */}
      <div className="login-hero">
        <div className="login-hero-brand">
          <img src={ticketLogo} alt="TicketLeader" />
          <h1>TicketLeader</h1>
        </div>
        <p>Your gateway to live events</p>
      </div>

      {/* Form area */}
      <div className="login-body">
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('login')}
          >
            Log In
          </button>
          <button
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="auth-form-title">
            {mode === 'login' ? 'Log in to your account' : 'Create an account'}
          </p>

          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Smith"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading
              ? mode === 'login'
                ? 'Logging in…'
                : 'Creating account…'
              : mode === 'login'
              ? 'Log In'
              : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.875rem', color: 'var(--muted)' }}>
          <Link to="/" style={{ color: 'var(--accent)' }}>← Back to Home</Link>
        </p>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <p className="footer-copy">© 2026 TicketLeader. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
