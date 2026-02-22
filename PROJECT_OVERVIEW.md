# VibeCheck Arena - Project Overview

## 💡 The Big Idea

**Problem:** Traditional CAPTCHAs and bot detection are frustrating for real fans trying to buy concert tickets. Long queues with no engagement create anxiety and poor user experience.

**Solution:** Turn the waiting room into an interactive, artist-themed gaming experience that's fun for humans AND serves as invisible bot detection. Fans play trivia, vote in polls, and match rhythms while AI silently analyzes their behavior to build a trust score.

**Key Innovation:** Security verification that feels like entertainment. Fans never feel like they're being tested - they're just having fun while waiting.

## 🎯 The Concept

Instead of showing fans a boring "Please wait..." screen or asking them to identify traffic lights, we give them:
- **Artist Trivia** - Test your fan knowledge
- **Live Polls** - Vote with other fans in real-time
- **Beat Sync** (future) - Tap along to your favorite songs
- **Emoji Vibe** (future) - Express song feelings with emojis

While they play, we analyze:
- Response time patterns (humans: 2-5 seconds, bots: instant or random)
- Mouse movement entropy (humans have natural variance, bots are mechanical)
- Scroll behavior (humans pause to read, bots don't)
- Answer patterns (real fans know artist history, bots guess randomly)

The result? A **trust score** that determines queue priority without ever showing users a CAPTCHA.

## 🏗️ What We Built (Phase 1)

### Frontend - React Application

**Technologies:**
- React 18 with TypeScript
- Tailwind CSS v3 for styling
- Component-based architecture

**Components Created:**

1. **QueueRoom.tsx** - The main waiting room
   - Real-time queue position display
   - Animated progress bar
   - Trust level visualization (star system)
   - Live fan statistics
   - Beautiful gradient background
   - Responsive mobile design

2. **TriviaGame.tsx** - Artist trivia challenge
   - 8 Taylor Swift questions (easy/medium/hard)
   - 10-second countdown timer per question
   - Visual feedback (green for correct, red for wrong)
   - Score tracking
   - Response time measurement for AI analysis
   - Trust boost calculation

3. **PollGame.tsx** - Community engagement polls
   - Single-choice questions
   - Slider-based rating questions (1-10 scale)
   - Real-time result visualization with percentage bars
   - Mock "other fans voted" data
   - Engagement timing tracking

4. **App.tsx** - Main application
   - View mode switching (queue ↔ games)
   - Session ID generation
   - Game result handling
   - Smooth transitions

### Backend - FastAPI Server

**Technologies:**
- FastAPI (Python web framework)
- SQLite database
- WebSocket support
- Pydantic models for data validation

**API Endpoints Built:**

**Content Endpoints:**
- `GET /api/content/{artist_id}/trivia` - Fetch trivia questions
- `GET /api/content/{artist_id}/polls` - Fetch poll questions
- `GET /api/content/{artist_id}/audio-clips` - Audio for beat sync (Phase 2)
- `GET /api/content/{artist_id}/songs` - Song vibe tags (Phase 2)
- `GET /api/content/{artist_id}` - Artist info

**Queue Endpoints:**
- `POST /api/queue/join` - Join the queue, get session ID
- `GET /api/queue/status/{session_id}` - Get current position
- `WebSocket /api/queue/ws/{session_id}` - Real-time updates

**Game Endpoints:**
- `POST /api/game/submit` - Submit game results
- `GET /api/game/session/{session_id}` - Get trust score & history
- `POST /api/game/behavior/stream` - Stream behavioral data

### Database

**SQLite Schema:**
- `artists` - Artist information
- `trivia_questions` - Question bank with difficulty levels
- `poll_questions` - Poll templates
- `audio_clips` - Beat sync audio data (Phase 2)
- `setlists` - Tour setlist data (Phase 2)
- `songs` - Song metadata with vibe tags (Phase 2)
- `sessions` - User session tracking

**Seed Data:**
- Complete Taylor Swift dataset
- 8 trivia questions across all difficulty levels
- 5 poll questions (mix of choice & slider)
- Event information (The Eras Tour at MetLife Stadium)

## 🛠️ How We Built It

### Step-by-Step Build Process

1. **Project Setup**
   ```bash
   # Frontend
   npx create-react-app frontend --template typescript
   npm install tailwindcss@3 react-router-dom socket.io-client framer-motion

   # Backend
   pip install fastapi uvicorn aiosqlite pydantic
   ```

2. **Database Creation**
   - Wrote SQL schema in `backend/db/schema.sql`
   - Created database helper in `backend/db/database.py`
   - Built seed script to populate from JSON files
   - Ran: `python3 db/seed.py`

3. **Backend API Development**
   - Created Pydantic models for type safety
   - Built RESTful endpoints with FastAPI
   - Implemented WebSocket for real-time queue updates
   - Added CORS middleware for frontend connection

4. **Frontend Components**
   - Designed UI with Tailwind utility classes
   - Built TypeScript interfaces for type safety
   - Created reusable game components
   - Implemented state management with React hooks
   - Added animations and transitions

5. **Integration**
   - Created API client library (`lib/api.ts`)
   - Connected components to backend endpoints
   - Tested full user flow (queue → game → results)

### Key Technical Decisions

**Why FastAPI?**
- Built-in async support for WebSockets
- Automatic API documentation
- Python ecosystem for future ML integration
- Fast and modern

**Why React + TypeScript?**
- Type safety prevents bugs
- Component reusability
- Large ecosystem
- Industry standard

**Why SQLite?**
- Zero configuration for hackathon demo
- Fast for read-heavy operations
- Easy to migrate to PostgreSQL later

**Why Tailwind?**
- Rapid UI development
- Consistent design system
- No CSS file management
- Easy to customize

## 📊 Current Status

### ✅ Working Features

**Frontend:**
- ✅ Beautiful queue room with live stats
- ✅ Fully functional trivia game
- ✅ Fully functional poll game
- ✅ Smooth game transitions
- ✅ Responsive design
- ✅ Trust level visualization

**Backend:**
- ✅ All API endpoints operational
- ✅ Database seeded with content
- ✅ WebSocket support enabled
- ✅ Interactive API docs at `/docs`
- ✅ CORS configured for local development

**Integration:**
- ✅ Frontend compiles successfully
- ✅ Backend serves on port 8000
- ✅ Frontend serves on port 3000
- ✅ API client ready for requests

### ⚠️ Known Limitations (Expected in Phase 1)

- WebSocket real-time updates are simulated (not fully connected)
- Trust scores calculated but not affecting actual queue position
- Behavioral data collection framework exists but not active
- Game results logged to console, not fully integrated with trust engine
- Only Taylor Swift content available

## 🚀 What's Next (Phase 2)

### High Priority Features

1. **Behavioral Data Collection**
   - Implement `behaviorCollector.ts`
   - Track mouse movements, scroll patterns, keystroke timing
   - Send data to backend via WebSocket
   - Store in session context

2. **AI Trust Score Engine**
   - Train scikit-learn RandomForest classifier
   - Generate training data (human vs bot patterns)
   - Implement real-time scoring
   - Add adaptive difficulty based on trust level

3. **Beat Sync Game**
   - Web Audio API integration
   - Dynamic Time Warping (DTW) for rhythm analysis
   - Tap timing variance detection
   - Visual pulse/beat indicators

4. **Demo Dashboard**
   - Split-screen view (fan experience vs AI analysis)
   - Real-time trust score visualization
   - Behavioral signal graphs
   - Bot simulation mode for judges

### Additional Games (Phase 2)

5. **Emoji Vibe Game**
   - Show song title
   - Fan picks 3-4 emojis
   - AI checks semantic coherence
   - Compare with community choices

6. **Setlist Shuffle**
   - Drag-and-drop interface
   - Order songs from a recent concert
   - Partial credit for close matches
   - Mouse behavior analysis

### Infrastructure Improvements

7. **Redis Integration**
   - Replace in-memory session storage
   - Enable horizontal scaling
   - Persistent queue state
   - Real-time pub/sub for WebSocket

8. **Enhanced WebSocket**
   - Full queue progression simulation
   - Live trust score updates
   - Position changes broadcast
   - Step-up challenge triggers

9. **Step-Up Challenges**
   - Rhythm Proof (harder beat matching)
   - Reverse Turing Test (AI vs human text)
   - Proof of Fandom (dynamic social media questions)

10. **More Artists**
    - Drake, Beyoncé, Bad Bunny datasets
    - Dynamic theming per artist
    - Genre-specific games

## 📁 File Structure Reference

```
bisonhacks-26/
├── frontend/                          # React app
│   ├── src/
│   │   ├── App.tsx                   # Main app, routing
│   │   ├── components/
│   │   │   ├── QueueRoom.tsx         # ⭐ Queue interface
│   │   │   └── games/
│   │   │       ├── TriviaGame.tsx    # ⭐ Trivia component
│   │   │       └── PollGame.tsx      # ⭐ Poll component
│   │   ├── lib/
│   │   │   └── api.ts                # API client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   └── index.css                 # Tailwind imports
│   ├── package.json                  # Dependencies
│   └── tailwind.config.js            # Tailwind config
│
├── backend/                           # FastAPI server
│   ├── main.py                       # ⭐ App entry point
│   ├── api/
│   │   ├── content.py                # ⭐ Content endpoints
│   │   ├── queue.py                  # ⭐ Queue + WebSocket
│   │   └── game.py                   # ⭐ Game submissions
│   ├── db/
│   │   ├── database.py               # DB connection
│   │   ├── schema.sql                # Database schema
│   │   ├── seed.py                   # Seed script
│   │   └── vibecheck.db              # SQLite database
│   ├── models/
│   │   └── schemas.py                # Pydantic models
│   └── requirements.txt              # Python deps
│
├── data/
│   └── artists/
│       └── taylor_swift.json         # ⭐ Sample data
│
├── README.md                          # Full documentation
├── PROJECT_STATUS.md                  # Implementation checklist
├── QUICKSTART.md                      # Quick start guide
├── PROJECT_OVERVIEW.md                # This file
├── VIBECHECK_ARENA_SPEC.md           # Original spec
├── start-backend.sh                   # Backend launcher
└── start-frontend.sh                  # Frontend launcher

⭐ = Core files you'll work with most
```

## 🎮 How to Run

**Terminal 1 - Backend:**
```bash
cd /Users/pop/bisonhacks-26/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd /Users/pop/bisonhacks-26/frontend
npm start
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## 🎯 Demo Strategy for Judges

### 3-Minute Pitch Flow

**Minute 1: The Problem & Solution (30 sec)**
- "Ticket bots ruin fan experiences. CAPTCHAs are frustrating."
- "We turned the queue into a game that's fun AND secure."
- Show Queue Room on screen

**Minute 2: Live Demo (90 sec)**
1. Show queue position and trust stars
2. Click "Play Trivia" - answer 2-3 questions
3. Show real-time timer, correct/incorrect feedback
4. Click "Take Poll" - vote on one poll
5. Show community results updating
6. Return to queue, point out trust level increased

**Minute 3: The AI Magic (60 sec)**
1. Open API docs (`/docs`) - show backend sophistication
2. Explain behavioral signals we track:
   - Response time patterns
   - Mouse movement entropy
   - Scroll behavior
3. Show Phase 2 roadmap (Beat Sync, ML classifier)
4. Impact: "Better experience + better security"

### Key Talking Points

**Technical Depth:**
- "Modern stack: React, TypeScript, FastAPI, SQLite"
- "WebSocket for real-time updates"
- "Type-safe APIs with Pydantic models"
- "Ready for ML integration with scikit-learn"

**Scalability:**
- "Designed for high-traffic events"
- "Horizontal scaling with Redis"
- "Async Python for concurrent users"

**Innovation:**
- "First gamified bot detection for ticketing"
- "Passive verification - no user friction"
- "Artist-themed content = brand engagement"

**Business Value:**
- "Reduces bot success rate"
- "Increases fan satisfaction"
- "Marketing opportunity (fan data, engagement)"
- "Differentiator for Ticketmaster"

## 💭 Why This Matters

### For Fans
- No more annoying CAPTCHAs
- Entertainment while waiting
- Community connection (polls)
- Fair access (humans prioritized)

### For Artists
- Tickets reach real fans
- Brand engagement during queue
- Fan insights from polls
- Better concert atmosphere

### For Ticketmaster
- Reduced bot purchases
- Higher customer satisfaction
- Competitive advantage
- Data-driven insights
- Marketing opportunities

## 🏆 Hackathon Fit

**Track:** Ticketmaster - "Leveraging AI for Truth & Service"

**How We Fit:**
- ✅ **Truth:** AI distinguishes real fans from bots
- ✅ **Service:** Better fan experience during purchase
- ✅ **AI Usage:** Behavioral analysis, pattern recognition
- ✅ **Innovation:** Novel approach to bot detection
- ✅ **Feasibility:** Working prototype in 24 hours
- ✅ **Impact:** Solves real pain point in ticketing

## 📝 Technical Achievements

### Code Quality
- TypeScript for type safety
- Component-based architecture
- Clean separation of concerns
- RESTful API design
- Database normalization

### Features Implemented
- 10+ API endpoints
- 3 interactive games
- Real-time queue simulation
- Trust score calculation
- Session management
- WebSocket support

### User Experience
- Smooth animations
- Responsive design
- Clear visual feedback
- Intuitive navigation
- Beautiful UI

## 🔮 Future Vision

**Short Term (Next Hackathon Session):**
- Complete Phase 2 (Beat Sync, ML classifier)
- Add 2 more artists
- Deploy to cloud
- Mobile app mockups

**Medium Term (3-6 months):**
- Production-ready infrastructure
- A/B testing framework
- Admin dashboard
- Analytics platform
- Ticketmaster API integration

**Long Term (1 year):**
- Multiple artist partnerships
- White-label solution for venues
- Real-time threat intelligence
- Blockchain ticket verification
- Global scaling

## 🙏 Acknowledgments

**Built for:** BisonHacks 2026 - Howard University
**Track:** Ticketmaster Challenge
**Theme:** "Leveraging AI for Truth & Service"
**Team Focus:** Fan Experience & UX

**Tech Stack Credits:**
- React - Meta
- FastAPI - Sebastián Ramírez
- Tailwind CSS - Adam Wathan
- TypeScript - Microsoft
- Python - Guido van Rossum

---

**Last Updated:** February 21, 2026
**Status:** Phase 1 Complete, Ready for Demo
**Next Steps:** Phase 2 AI Integration
