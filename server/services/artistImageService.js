const https = require('https');

const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(new Error(`Invalid JSON response: ${err.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function fetchLastFmArtistImage(artistName) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || !artistName) return '';

  const params = new URLSearchParams({
    method: 'artist.getInfo',
    artist: artistName,
    api_key: apiKey,
    format: 'json',
    autocorrect: '1',
  });

  const url = `${LASTFM_BASE_URL}?${params.toString()}`;
  const body = await fetchJson(url);
  const images = body?.artist?.image;
  if (!Array.isArray(images) || images.length === 0) return '';

  const best =
    images.find((img) => img?.size === 'extralarge' && img['#text']) ||
    images.find((img) => img?.size === 'large' && img['#text']) ||
    images.find((img) => img?.['#text']);

  return best?.['#text'] || '';
}

module.exports = { fetchLastFmArtistImage };
