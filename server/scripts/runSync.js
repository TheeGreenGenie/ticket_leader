require('dotenv').config();
const mongoose = require('mongoose');
const { syncTicketmasterEvents } = require('../services/ticketmasterService');

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Starting Ticketmaster sync...\n');

  const stats = await syncTicketmasterEvents();

  console.log('\n── Sync complete ──────────────────');
  console.log('Fetched: ', stats.fetched);
  console.log('Created: ', stats.created);
  console.log('Updated: ', stats.updated);
  console.log('Skipped: ', stats.skipped);
  if (stats.errors.length) {
    console.log('Errors:  ', stats.errors.length);
    stats.errors.forEach(e => console.log('  ', e));
  }
  console.log('───────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
