# Live Queue Feature - Implementation Plan

## Overview
This plan outlines the implementation of a Live Queue feature as a standalone page on the TicketLeader platform. The Live Queue will be an interactive, gamified waiting room experience inspired by the VibeCheck Arena concept described in PROJECT_OVERVIEW.md, adapted for the TicketLeader ticketing platform.

## Current TicketLeader Architecture

**Frontend (React + Vite):**
- React 18 with Vite
- React Router v6 for routing
- Axios for API calls
- Current routes: `/` (LoginPage), `/dashboard` (DashboardPage)
- Component structure: Header, Navbar, Footer
- JWT authentication stored in localStorage

**Backend (Node.js + Express + MongoDB):**
- Express 4 server on port 5000
- MongoDB with Mongoose ODM
- JWT authentication (bcryptjs + jsonwebtoken)
- Existing endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/health`

## Feature Goals

The Live Queue will:
1. Provide an engaging waiting room experience for ticket buyers
2. Act as passive bot detection through gamified interactions
3. Track user behavior to build trust scores
4. Determine queue priority based on engagement
5. Include artist-themed trivia and polls
6. Display real-time queue position and estimated wait time
7. Show trust level visualization

## Implementation Phases

---

## Phase 1: Backend Infrastructure

### 1.1 Database Schema Design

**New MongoDB Collections:**

```javascript
// Queue Sessions
{
  _id: ObjectId,
  userId: ObjectId (ref: User) | null,  // null for anonymous users
  sessionId: String (unique),           // UUID for anonymous tracking
  eventId: ObjectId (ref: Event),
  joinedAt: Date,
  currentPosition: Number,
  trustScore: Number (0-100),
  trustLevel: String (enum: ['bronze', 'silver', 'gold', 'platinum']),
  status: String (enum: ['waiting', 'active', 'completed', 'expired']),
  behavioralData: {
    mouseMovements: Number,
    scrollEvents: Number,
    timeSpent: Number,
    gamesPlayed: Number
  },
  lastActivity: Date
}

// Events (Concerts/Shows)
{
  _id: ObjectId,
  artistName: String,
  eventName: String,
  venue: String,
  date: Date,
  artistId: ObjectId (ref: Artist),
  queueCapacity: Number,
  currentQueueSize: Number,
  isActive: Boolean
}

// Artists
{
  _id: ObjectId,
  name: String,
  slug: String,
  imageUrl: String,
  bio: String,
  createdAt: Date
}

// Trivia Questions
{
  _id: ObjectId,
  artistId: ObjectId (ref: Artist),
  question: String,
  options: [String],
  correctAnswer: Number (index),
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  category: String,
  trustBoost: Number  // Points awarded for correct answer
}

// Poll Questions
{
  _id: ObjectId,
  artistId: ObjectId (ref: Artist),
  question: String,
  type: String (enum: ['single-choice', 'slider']),
  options: [String] | null,  // null for slider type
  sliderRange: { min: Number, max: Number } | null,
  category: String
}

// Game Results
{
  _id: ObjectId,
  sessionId: String (ref: QueueSession),
  gameType: String (enum: ['trivia', 'poll']),
  questionId: ObjectId,
  userAnswer: String | Number,
  isCorrect: Boolean | null,
  responseTime: Number (milliseconds),
  trustBoostEarned: Number,
  playedAt: Date
}

// Behavioral Streams
{
  _id: ObjectId,
  sessionId: String,
  eventType: String (enum: ['mouse_move', 'scroll', 'click', 'keypress']),
  timestamp: Date,
  data: Object,  // Flexible for different event types
  entropy: Number  // Calculated variance/randomness
}
```

### 1.2 Backend API Endpoints

**Queue Management:**
- `POST /api/queue/join` - Join queue for an event
  - Body: `{ eventId, userId? }`
  - Returns: `{ sessionId, position, estimatedWait }`

- `GET /api/queue/status/:sessionId` - Get current queue status
  - Returns: `{ position, estimatedWait, trustScore, trustLevel, queueSize }`

- `POST /api/queue/leave/:sessionId` - Leave queue
  - Returns: `{ success: true }`

**Content Endpoints:**
- `GET /api/content/artists/:artistId` - Get artist info
- `GET /api/content/artists/:artistId/trivia` - Get trivia questions (randomized)
- `GET /api/content/artists/:artistId/polls` - Get poll questions (randomized)
- `GET /api/events` - List active events
- `GET /api/events/:eventId` - Get event details

**Game Endpoints:**
- `POST /api/games/submit` - Submit game result
  - Body: `{ sessionId, gameType, questionId, answer, responseTime }`
  - Returns: `{ correct, trustBoostEarned, newTrustScore }`

- `GET /api/games/history/:sessionId` - Get game history
  - Returns: `[{ gameType, score, playedAt }]`

**Behavioral Tracking:**
- `POST /api/behavior/stream` - Stream behavioral data
  - Body: `{ sessionId, events: [{ type, timestamp, data }] }`
  - Returns: `{ success: true }`

### 1.3 WebSocket Implementation

**Socket.io Integration:**
- Install `socket.io` on backend
- Real-time queue position updates
- Live trust score changes
- Queue progression notifications
- Event: `queue:position-update`
- Event: `queue:trust-update`
- Event: `queue:advance` (when user reaches front)

---

## Phase 2: Frontend Components

### 2.1 New Page: LiveQueuePage

**Location:** `frontend/src/pages/LiveQueuePage.jsx`

**Structure:**
```jsx
LiveQueuePage
├── QueueHeader (artist info, event details)
├── QueueStatus (position, trust level, estimated wait)
├── GameSelector (tabs/buttons to switch between games)
├── GameArea
│   ├── TriviaGame
│   ├── PollGame
│   └── IdleState (when no game active)
└── QueueFooter (stats, exit button)
```

**Key Features:**
- Responsive design matching TicketLeader aesthetic
- Real-time updates via WebSocket
- Smooth transitions between games
- Trust level visualization (star system or progress bar)
- Queue position animation

### 2.2 Game Components

**TriviaGame Component** (`frontend/src/components/games/TriviaGame.jsx`)
- Display question with 4 options
- 10-second countdown timer
- Visual feedback (correct/incorrect)
- Score tracking
- Response time measurement
- Trust boost notification

**PollGame Component** (`frontend/src/components/games/PollGame.jsx`)
- Single-choice polls with radio buttons
- Slider polls (1-10 scale)
- Real-time results visualization
- Community vote percentages
- Engagement tracking

**QueueStatus Component** (`frontend/src/components/queue/QueueStatus.jsx`)
- Current position in queue
- Estimated wait time
- Trust level indicator
- Queue size visualization
- Animated progress

### 2.3 Utility Components

**TrustLevelBadge** - Visual trust indicator
**CountdownTimer** - Reusable timer component
**ProgressBar** - Queue progression visualization
**LiveStats** - Real-time queue statistics

### 2.4 API Client Extensions

**Location:** `frontend/src/api/queue.js`

```javascript
// Queue API functions
export const joinQueue = (eventId, userId) => { ... }
export const getQueueStatus = (sessionId) => { ... }
export const leaveQueue = (sessionId) => { ... }
export const submitGame = (gameData) => { ... }
export const streamBehavior = (sessionId, events) => { ... }
```

**Location:** `frontend/src/api/content.js`

```javascript
// Content API functions
export const getArtist = (artistId) => { ... }
export const getTrivia = (artistId) => { ... }
export const getPolls = (artistId) => { ... }
export const getEvents = () => { ... }
```

### 2.5 Behavioral Tracking

**Location:** `frontend/src/utils/behaviorCollector.js`

- Track mouse movements (with throttling)
- Track scroll events
- Track click patterns
- Measure interaction timing
- Batch and send data every 5 seconds
- Calculate entropy locally before sending

---

## Phase 3: Routing & Navigation

### 3.1 Add Queue Route

**Update:** `frontend/src/App.jsx`

```jsx
<Routes>
  <Route path="/" element={<LoginPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/queue/:eventId" element={<LiveQueuePage />} />
</Routes>
```

### 3.2 Navigation Updates

**Update:** `frontend/src/components/Navbar.jsx`
- Add "Live Queue" link in navigation
- Dropdown to show active events
- Direct link to join queue

**Update:** `frontend/src/pages/DashboardPage.jsx`
- Add "Join Queue" buttons for upcoming events
- Show current queue status if user is in a queue

---

## Phase 4: Real-time Features

### 4.1 WebSocket Client Setup

**Install:** `socket.io-client`

**Location:** `frontend/src/services/socketService.js`

```javascript
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(sessionId) {
    this.socket = io('http://127.0.0.1:5000', {
      query: { sessionId }
    });

    this.socket.on('queue:position-update', this.handlePositionUpdate);
    this.socket.on('queue:trust-update', this.handleTrustUpdate);
    this.socket.on('queue:advance', this.handleAdvance);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Event handlers...
}

export default new SocketService();
```

### 4.2 Queue Progression Logic

**Backend:** Implement queue advancement algorithm
- FIFO with trust score modifiers
- Higher trust = better position
- Periodic queue shuffling based on scores
- Step-up challenges for suspicious behavior

---

## Phase 5: Data & Content

### 5.1 Seed Data

**Create:** `server/seeds/artists.json`
- Taylor Swift (reference from PROJECT_OVERVIEW.md)
- 2-3 additional popular artists

**Create:** `server/seeds/trivia.json`
- 10+ questions per artist
- Mix of easy, medium, hard
- Varied categories (history, songs, awards, etc.)

**Create:** `server/seeds/polls.json`
- 5+ polls per artist
- Mix of single-choice and slider
- Engaging topics (favorite songs, concert preferences)

**Create:** `server/seeds/events.json`
- Sample upcoming concerts
- Linked to artists

### 5.2 Seeding Script

**Create:** `server/scripts/seedDatabase.js`
- Clear existing queue/content data
- Insert artists, trivia, polls, events
- Generate sample queue sessions for testing

---

## Phase 6: Styling & UX

### 6.1 Design System

**Colors:**
- Match existing TicketLeader brand colors
- Trust level colors: Bronze (#CD7F32), Silver (#C0C0C0), Gold (#FFD700), Platinum (#E5E4E2)
- Success/error states

**Typography:**
- Consistent with existing Header/Footer
- Readable fonts for questions
- Large, clear trust indicators

**Animations:**
- Queue position changes
- Trust level upgrades
- Correct/incorrect answer feedback
- Smooth game transitions

### 6.2 Responsive Design

- Mobile-first approach
- Touch-friendly game interfaces
- Collapsible sections for small screens
- Optimized for 320px to 1920px widths

---

## Phase 7: Testing & Optimization

### 7.1 Testing Checklist

- [ ] Queue join/leave functionality
- [ ] Real-time position updates
- [ ] Trivia game submission and scoring
- [ ] Poll game submission and results
- [ ] Trust score calculation accuracy
- [ ] WebSocket reconnection handling
- [ ] Multiple concurrent users
- [ ] Session persistence across page refresh
- [ ] Behavioral data collection
- [ ] Mobile responsiveness

### 7.2 Performance Optimizations

- Debounce behavioral event collection
- Lazy load game components
- Optimize WebSocket message size
- Cache artist/event data
- Minimize re-renders with React.memo
- Index MongoDB queries properly

---

## Implementation Timeline (Estimated)

**Day 1-2: Backend Foundation**
- Database schema & models (2-3 hours)
- API endpoints (3-4 hours)
- Seed data creation (1-2 hours)

**Day 3-4: Frontend Components**
- LiveQueuePage layout (2-3 hours)
- Game components (3-4 hours)
- API integration (2 hours)

**Day 5: Real-time Features**
- WebSocket backend (2-3 hours)
- WebSocket frontend (2-3 hours)
- Behavioral tracking (1-2 hours)

**Day 6: Polish & Testing**
- Styling & animations (2-3 hours)
- Bug fixes & testing (2-3 hours)
- Mobile optimization (1-2 hours)

**Total:** ~25-35 hours of development

---

## File Structure After Implementation

```
ticket_leader/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── LiveQueuePage.jsx          ← NEW
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── queue/                     ← NEW
│   │   │   │   ├── QueueStatus.jsx
│   │   │   │   ├── QueueHeader.jsx
│   │   │   │   └── TrustLevelBadge.jsx
│   │   │   └── games/                     ← NEW
│   │   │       ├── TriviaGame.jsx
│   │   │       ├── PollGame.jsx
│   │   │       └── GameSelector.jsx
│   │   ├── api/
│   │   │   ├── auth.js
│   │   │   ├── queue.js                   ← NEW
│   │   │   └── content.js                 ← NEW
│   │   ├── services/
│   │   │   └── socketService.js           ← NEW
│   │   ├── utils/
│   │   │   └── behaviorCollector.js       ← NEW
│   │   └── App.jsx (updated routing)
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── QueueSession.js                ← NEW
│   │   ├── Event.js                       ← NEW
│   │   ├── Artist.js                      ← NEW
│   │   ├── TriviaQuestion.js              ← NEW
│   │   ├── PollQuestion.js                ← NEW
│   │   └── GameResult.js                  ← NEW
│   ├── routes/
│   │   ├── auth.js
│   │   ├── queue.js                       ← NEW
│   │   ├── content.js                     ← NEW
│   │   └── games.js                       ← NEW
│   ├── services/
│   │   ├── queueManager.js                ← NEW
│   │   └── trustScoreCalculator.js        ← NEW
│   ├── sockets/
│   │   └── queueSocket.js                 ← NEW
│   ├── seeds/
│   │   ├── artists.json                   ← NEW
│   │   ├── trivia.json                    ← NEW
│   │   ├── polls.json                     ← NEW
│   │   └── events.json                    ← NEW
│   ├── scripts/
│   │   └── seedDatabase.js                ← NEW
│   └── index.js (updated with socket.io)
│
└── LIVE_QUEUE_IMPLEMENTATION_PLAN.md (this file)
```

---

## Key Technical Decisions

### Why Socket.io?
- Real-time bidirectional communication
- Automatic reconnection handling
- Room-based broadcasting (per event)
- Easy integration with Express
- Fallback to long-polling if WebSocket unavailable

### Why Keep MongoDB?
- Already integrated in TicketLeader
- Flexible schema for behavioral data
- Good performance for queue operations
- Easy to scale with sharding if needed

### Why Separate Queue Page?
- Focused user experience
- Reduces dashboard complexity
- Allows deep linking to specific events
- Better SEO for event-specific queues

### Trust Score Algorithm (Initial)
```
Base Score: 50
+ Correct trivia answer: +5 to +15 (based on difficulty)
+ Poll participation: +3
+ Time spent in queue: +1 per minute (max +20)
+ Behavioral consistency: +0 to +10 (calculated from entropy)
- Fast/robotic responses: -10
- No mouse movement: -15
- Leaving and rejoining: -5

Levels:
Bronze: 0-40
Silver: 41-60
Gold: 61-80
Platinum: 81-100
```

---

## Future Enhancements (Post-Launch)

### Phase 2 Features:
1. **Beat Sync Game** - Rhythm tapping game
2. **Emoji Vibe Game** - Emoji-based song association
3. **Setlist Shuffle** - Drag-and-drop song ordering
4. **Step-Up Challenges** - Additional verification for low trust scores
5. **Admin Dashboard** - Monitor queues, manage content
6. **Analytics** - User engagement metrics, bot detection rates
7. **Multiple Artist Support** - Easy content management
8. **Mobile App** - Native iOS/Android apps
9. **Redis Integration** - For high-traffic scaling
10. **ML-Based Bot Detection** - scikit-learn classifier

---

## Security Considerations

1. **Rate Limiting**
   - Limit queue join attempts per IP
   - Throttle game submissions
   - Prevent spam behavioral data

2. **Session Validation**
   - Verify sessionId authenticity
   - Expire old sessions
   - Prevent session hijacking

3. **Data Sanitization**
   - Validate all user inputs
   - Sanitize behavioral data
   - Prevent NoSQL injection

4. **Bot Detection**
   - Monitor response time patterns
   - Flag suspicious behavioral entropy
   - Implement CAPTCHA fallback for very low trust

---

## Success Metrics

- **User Engagement:** Average time spent in queue
- **Bot Reduction:** Percentage of flagged bot sessions
- **Trust Distribution:** % of users in each trust level
- **Game Completion:** % of users playing at least one game
- **Queue Satisfaction:** User feedback/surveys
- **Technical Performance:** WebSocket latency, API response times

---

## Notes

- This plan adapts the VibeCheck Arena concept from PROJECT_OVERVIEW.md to fit the existing TicketLeader architecture
- The queue page will be accessible at `/queue/:eventId`
- Users can join queues for specific events/concerts
- Anonymous users can participate (sessionId-based tracking)
- Logged-in users get persistent queue history
- All content is artist-themed to match the event

---

**Status:** Planning Phase Complete
**Next Step:** Create dev-live-queue branch and begin Phase 1 implementation
**Last Updated:** February 21, 2026

