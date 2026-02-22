const https = require('https');
const Artist = require('../models/Artist');
const Event  = require('../models/Event');

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const PAGE_SIZE = 200; // max allowed by Ticketmaster

// Slugify a name for use as Artist.slug
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pick the best image from an attractions images array (prefer 16_9 ratio, widest)
function pickImage(images = []) {
  const ratio16 = images.filter(i => i.ratio === '16_9');
  const pool = ratio16.length ? ratio16 : images;
  if (!pool.length) return '';
  return pool.reduce((best, img) => ((img.width || 0) > (best.width || 0) ? img : best)).url || '';
}

// Build genre string from Ticketmaster classifications array
function buildGenre(classifications = []) {
  const c = classifications[0];
  if (!c) return '';
  const parts = [c.segment?.name, c.genre?.name].filter(Boolean);
  return parts.join(' / ');
}

// Fetch one page of events from Ticketmaster Discovery API
function fetchPage(apiKey, startDateTime, endDateTime, page) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      apikey: apiKey,
      startDateTime,
      endDateTime,
      size:         PAGE_SIZE,
      page,
      sort:         'date,asc',
      countryCode:  'US',
    });

    const url = `${BASE_URL}/events.json?${params.toString()}`;

    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(raw);
          if (res.statusCode === 429) {
            reject(new Error('Ticketmaster rate limit hit (429). Try again shortly.'));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Ticketmaster returned HTTP ${res.statusCode}: ${raw}`));
            return;
          }
          resolve(body);
        } catch (err) {
          reject(new Error(`Failed to parse Ticketmaster response: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Upsert one artist, return its _id
async function upsertArtist(attraction) {
  const name  = attraction.name?.trim();
  if (!name) return null;

  const slug     = slugify(name);
  const imageUrl = pickImage(attraction.images);
  const genre    = buildGenre(attraction.classifications);

  const artist = await Artist.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, createdAt: new Date() }, $set: { imageUrl, genre } },
    { upsert: true, new: true }
  );
  return artist._id;
}

// Upsert one event record. Key: ticketmasterId stored in a separate field is
// ideal, but since we don't want to change the schema we use a composite of
// eventName + venue + date (rounded to hour) as the dedup key.
async function upsertEvent(tmEvent, artistId) {
  const venue      = tmEvent._embedded?.venues?.[0];
  const venueName  = venue?.name?.trim()  || 'Unknown Venue';
  const city       = [venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', ') || 'Unknown City';
  const lat        = parseFloat(venue?.location?.latitude)  || null;
  const lng        = parseFloat(venue?.location?.longitude) || null;
  const rawDate    = tmEvent.dates?.start?.dateTime || tmEvent.dates?.start?.localDate;
  const date       = rawDate ? new Date(rawDate) : null;
  if (!date || isNaN(date)) return null;

  const eventName  = tmEvent.name?.trim() || 'Event';
  const isActive   = tmEvent.dates?.status?.code !== 'cancelled';

  // Dedup key: name + venue + hour of date
  const hourBucket = new Date(date);
  hourBucket.setMinutes(0, 0, 0);

  const filter = {
    eventName,
    venue:    venueName,
    date:     { $gte: new Date(hourBucket.getTime() - 30 * 60000),
                $lte: new Date(hourBucket.getTime() + 30 * 60000) },
  };

  const update = {
    $set: {
      artistId,
      eventName,
      venue:    venueName,
      city,
      coordinates: { lat, lng },
      date,
      isActive,
    },
    $setOnInsert: {
      queueCapacity:    10000,
      currentQueueSize: 0,
      createdAt:        new Date(),
    },
  };

  const result = await Event.findOneAndUpdate(filter, update, { upsert: true, new: true, lean: true });
  return result;
}

/**
 * syncTicketmasterEvents
 * Fetches all US concerts + sports events for the next 30 days from the
 * Ticketmaster Discovery API, upserts Artists and Events into MongoDB.
 *
 * Returns: { fetched, created, updated, skipped, errors }
 */
async function syncTicketmasterEvents() {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
    throw new Error('TICKETMASTER_API_KEY is not set in .env');
  }

  const now   = new Date();
  const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Ticketmaster requires ISO 8601 with Z
  const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const endDateTime   = later.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const stats = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  // --- Page 0 to discover total pages ---
  let firstPage;
  try {
    firstPage = await fetchPage(apiKey, startDateTime, endDateTime, 0);
  } catch (err) {
    throw new Error(`Failed to fetch page 0 from Ticketmaster: ${err.message}`);
  }

  const totalPages = firstPage.page?.totalPages ?? 1;
  const allPages   = [firstPage];

  // Ticketmaster caps deep paging at page * size < 1000, so max ~4 pages at size=200
  const maxPage = Math.min(totalPages, Math.floor(1000 / PAGE_SIZE));

  // Fetch remaining pages (sequentially to stay under rate limit)
  for (let p = 1; p < maxPage; p++) {
    try {
      const page = await fetchPage(apiKey, startDateTime, endDateTime, p);
      allPages.push(page);
      // Small delay to respect the 5 req/s rate limit
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      stats.errors.push(`Page ${p}: ${err.message}`);
      break;
    }
  }

  // --- Process all events ---
  for (const pageData of allPages) {
    const events = pageData._embedded?.events ?? [];
    stats.fetched += events.length;

    for (const tmEvent of events) {
      try {
        // Resolve primary attraction (performer / team)
        const attractions = tmEvent._embedded?.attractions ?? [];
        const primary     = attractions[0];

        let artistId;
        if (primary) {
          artistId = await upsertArtist(primary);
        }

        // If no attraction found, create a generic artist from the event name
        if (!artistId) {
          const fallbackName = tmEvent.name?.trim() || 'Unknown Artist';
          artistId = await upsertArtist({
            name:            fallbackName,
            images:          tmEvent.images ?? [],
            classifications: tmEvent.classifications ?? [],
          });
        }

        if (!artistId) { stats.skipped++; continue; }

        const before = await Event.countDocuments({
          eventName: tmEvent.name?.trim(),
          venue:     tmEvent._embedded?.venues?.[0]?.name?.trim(),
        });

        await upsertEvent(tmEvent, artistId);

        const after = await Event.countDocuments({
          eventName: tmEvent.name?.trim(),
          venue:     tmEvent._embedded?.venues?.[0]?.name?.trim(),
        });

        if (after > before) stats.created++;
        else                 stats.updated++;

      } catch (err) {
        stats.errors.push(`Event "${tmEvent.name}": ${err.message}`);
        stats.skipped++;
      }
    }
  }

  return stats;
}

module.exports = { syncTicketmasterEvents };
