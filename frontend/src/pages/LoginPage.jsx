import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { login, signup } from '../api/auth';
import '../styles/styles.css';

const SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google's test site key

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'login' | 'signup'
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
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Server unavailable. Please try again later.';
      setError(msg);
      recaptchaRef.current?.reset();
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
            <ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} />
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
            <ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} />
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
