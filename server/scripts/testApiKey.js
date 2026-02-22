require('dotenv').config();
const https = require('https');

const key = process.env.TICKETMASTER_API_KEY;
console.log('Key loaded:', key ? key.slice(0, 6) + '...' : 'MISSING');

const now   = new Date();
const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const start = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
const end   = later.toISOString().replace(/\.\d{3}Z$/, 'Z');

const params = new URLSearchParams({
  apikey: key,
  startDateTime: start,
  endDateTime:   end,
  size:          5,
  countryCode:   'US',
});

const url = 'https://app.ticketmaster.com/discovery/v2/events.json?' + params.toString();

https.get(url, (res) => {
  let raw = '';
  res.on('data', c => { raw += c; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('ERROR HTTP', res.statusCode, raw);
      return;
    }
    const body = JSON.parse(raw);
    const events = body._embedded?.events ?? [];
    console.log('HTTP status:             ', res.statusCode);
    console.log('Total events available:  ', body.page?.totalElements);
    console.log('Total pages:             ', body.page?.totalPages);
    console.log('\nFirst 5 events:');
    events.forEach(e => {
      const venue = e._embedded?.venues?.[0];
      console.log(
        ' -', e.name,
        '|', venue?.name,
        `${venue?.city?.name}, ${venue?.state?.stateCode}`,
        '|', e.dates?.start?.localDate
      );
    });
  });
}).on('error', err => {
  console.error('Request error:', err.message);
});
