const express = require('express');
const router  = express.Router();
const { syncTicketmasterEvents } = require('../services/ticketmasterService');

/**
 * POST /api/sync/ticketmaster
 *
 * Fetches all US events for the next 30 days from the Ticketmaster Discovery
 * API and upserts them into the local MongoDB.  Safe to call repeatedly —
 * existing records are updated in-place, not duplicated.
 *
 * Response:
 *   { success: true, stats: { fetched, created, updated, skipped, errors } }
 */
router.post('/ticketmaster', async (req, res) => {
  try {
    console.log('[sync] Ticketmaster sync started...');
    const stats = await syncTicketmasterEvents();
    console.log('[sync] Ticketmaster sync complete:', stats);
    res.json({ success: true, stats });
  } catch (err) {
    console.error('[sync] Ticketmaster sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sync/status
 *
 * Quick health-check — confirms the API key is configured.
 */
router.get('/status', (req, res) => {
  const key = process.env.TICKETMASTER_API_KEY;
  const configured = key && key !== 'YOUR_KEY_HERE';
  res.json({
    ticketmaster: configured ? 'configured' : 'missing — set TICKETMASTER_API_KEY in .env',
  });
});

module.exports = router;
