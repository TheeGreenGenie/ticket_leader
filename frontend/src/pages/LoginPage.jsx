import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../api/auth';
import '../styles/styles.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'login' | 'signup'
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
    <>
      {/* Mirrors login.html: hero banner */}
      <div className="heroBanner">
        <h1>TicketLeader</h1>
        <img alt="" />
      </div>

      {/* Mirrors login.html: .lands with Login + Sign Up buttons */}
      <div className="lands">
        <div className="lands-buttons">
          <button onClick={() => handleModeSwitch('login')}>Login</button>
          <button onClick={() => handleModeSwitch('signup')}>Sign Up</button>
        </div>

        {/* Inline form — appears below buttons when a mode is selected */}
        {mode === 'login' && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>

      {/* Mirrors shared footer */}
      <div className="footer">
        <p>TicketLeader 2026 ©</p>
      </div>
    </>
  );
}
