const express = require('express');
const axios = require('axios');
const router = express.Router();

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// POST /api/tts
// Body: { text: string }
// Returns: audio/mpeg stream
router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ message: 'text is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return res.status(503).json({ message: 'TTS service not configured' });
  }

  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/${voiceId}`,
      {
        text: text.trim(),
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'stream',
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail?.message || 'TTS request failed';
    console.error('ElevenLabs TTS error:', message);
    res.status(status).json({ message });
  }
});

module.exports = router;
