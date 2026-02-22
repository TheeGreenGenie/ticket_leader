const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

// ── User schema ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Helper: sign JWT ─────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Helper: verify reCAPTCHA token ───────────────────────────
async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return false;
  if (!token) return false;
  const params = new URLSearchParams({
    secret,
    response: token,
  });
  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  return data.success === true;
}

// ── POST /api/auth/signup ────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, captchaToken } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const captchaOk = await verifyCaptcha(captchaToken).catch(() => false);
  if (!captchaOk)
    return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'An account with that email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = signToken(user);

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password, captchaToken } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const captchaOk = await verifyCaptcha(captchaToken).catch(() => false);
  if (!captchaOk)
    return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
