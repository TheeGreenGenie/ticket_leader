const Event = require('./models/Event');

const SEED_EVENT = {
  slug: 'england-vs-croatia',
  title: 'England vs Croatia',
  subtitle: 'World Cup · Match 22 (Group L)',
  date: 'Wed, Jun 17',
  time: '3:00pm',
  venue: 'AT&T Stadium',
  city: 'Arlington, TX',
  basePrice: 1063,
  image: '/assets/englandvs.jpg',
  sections: [
    {
      name: 'Upper Deck',
      description: 'Rows 1–30 · End zones & corners',
      price: 1063,
      available: 200,
      total: 200,
    },
    {
      name: 'Lower Bowl',
      description: 'Rows 1–25 · Sideline & corner views',
      price: 1850,
      available: 80,
      total: 80,
    },
    {
      name: 'Field Level VIP',
      description: 'Rows 1–10 · Pitch-side premium',
      price: 3500,
      available: 20,
      total: 20,
    },
  ],
};

async function seed() {
  try {
    const existing = await Event.findOne({ slug: SEED_EVENT.slug });
    if (!existing) {
      await Event.create(SEED_EVENT);
      console.log('✓ Seeded event: England vs Croatia');
    } else {
      console.log('✓ Seed already present, skipping.');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = seed;
