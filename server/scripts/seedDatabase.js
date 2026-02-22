require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Artist = require('../models/Artist');
const Event = require('../models/Event');
const TriviaQuestion = require('../models/TriviaQuestion');
const PollQuestion = require('../models/PollQuestion');
const QueueSession = require('../models/QueueSession');
const GameResult = require('../models/GameResult');
const BehavioralStream = require('../models/BehavioralStream');

// Load seed data
const artistsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/artists.json'), 'utf8')
);
const triviaData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/trivia.json'), 'utf8')
);
const pollsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/polls.json'), 'utf8')
);
const eventsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/events.json'), 'utf8')
);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Clear existing queue-related data
    console.log('Clearing existing queue data...');
    await Artist.deleteMany({});
    await Event.deleteMany({});
    await TriviaQuestion.deleteMany({});
    await PollQuestion.deleteMany({});
    await QueueSession.deleteMany({});
    await GameResult.deleteMany({});
    await BehavioralStream.deleteMany({});
    console.log('Existing data cleared');

    // Seed Artists
    console.log('Seeding artists...');
    const artists = await Artist.insertMany(artistsData);
    console.log(`${artists.length} artists created`);

    // Create artist slug to ID mapping
    const artistMap = {};
    artists.forEach(artist => {
      artistMap[artist.slug] = artist._id;
    });

    // Seed Trivia Questions
    console.log('Seeding trivia questions...');
    const triviaQuestions = triviaData.map(trivia => ({
      ...trivia,
      artistId: artistMap[trivia.artistSlug]
    }));
    // Remove artistSlug field before inserting
    triviaQuestions.forEach(q => delete q.artistSlug);
    const triviaResults = await TriviaQuestion.insertMany(triviaQuestions);
    console.log(`${triviaResults.length} trivia questions created`);

    // Seed Poll Questions
    console.log('Seeding poll questions...');
    const pollQuestions = pollsData.map(poll => {
      const pollDoc = {
        artistId: artistMap[poll.artistSlug],
        question: poll.question,
        type: poll.type,
        category: poll.category
      };

      if (poll.type === 'single-choice') {
        pollDoc.options = poll.options;
        if (poll.mockResults) {
          pollDoc.mockResults = poll.mockResults;
        }
      } else if (poll.type === 'slider') {
        pollDoc.sliderRange = poll.sliderRange;
      }

      return pollDoc;
    });
    const pollResults = await PollQuestion.insertMany(pollQuestions);
    console.log(`${pollResults.length} poll questions created`);

    // Seed Events
    console.log('Seeding events...');
    const events = eventsData.map(event => ({
      ...event,
      artistId: artistMap[event.artistSlug],
      date: new Date(event.date)
    }));
    // Remove artistSlug field before inserting
    events.forEach(e => delete e.artistSlug);
    const eventResults = await Event.insertMany(events);
    console.log(`${eventResults.length} events created`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Artists: ${artists.length}`);
    console.log(`- Trivia Questions: ${triviaResults.length}`);
    console.log(`- Poll Questions: ${pollResults.length}`);
    console.log(`- Events: ${eventResults.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
