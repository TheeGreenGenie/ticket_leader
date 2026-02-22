# TicketLeader

A revolutionary ticketing platform that combines fair queue management with gamified bot detection. Built for BisonHacks 2026.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-8.4-47A248?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io)
![Three.js](https://img.shields.io/badge/Three.js-0.183-000000?logo=three.js)

## Live Site Link - https://ticket-leader.vercel.app/live-queue

## Features

### Live Queue System
- Real-time queue position updates via WebSocket
- Trust score-based queue prioritization
- Estimated wait time calculations
- Session persistence across page reloads

### Multi-Layer Bot Detection
1. **reCAPTCHA** - Google reCAPTCHA on signup/login
2. **Trivia Gate** - Artist knowledge verification before queue entry
3. **IP Flagging** - Detects multiple sessions from same IP
4. **Response Analysis** - Penalizes instant/bot-like responses
5. **Behavioral Tracking** - Mouse movement, scroll patterns, click analysis
6. **Biometric Verification** - WebAuthn (Face ID/Touch ID) for flagged users

### Gamification
- **Trivia Games** - 10-second timer, difficulty-based rewards (+5-15 trust)
- **Fan Polls** - Vote on artist topics (+3-5 trust)
- **Trust Levels** - Bronze, Silver, Gold, Platinum tiers
- **AI-Generated Questions** - Google Gemini creates dynamic, location-aware trivia

### 3D Stadium Experience
- Interactive 80,000-seat stadium visualization (AT&T Stadium)
- Three navigation modes: Orbit, Walkthrough, Parking
- Seat finder with spoken directions (TTS)
- Real-time distance and ETA calculations
- Section highlighting and path routing

### Location Features
- Geolocation-based local fan verification
- Distance calculation to venue (Haversine formula)
- Local trivia questions for nearby fans
- Trust boost for verified local attendance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Three.js, React Three Fiber, Socket.IO Client |
| Backend | Node.js, Express 4, MongoDB 8, Mongoose, Socket.IO |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT, bcryptjs, Google reCAPTCHA, WebAuthn |
| 3D | Three.js, @react-three/fiber, @react-three/drei |
| DevOps | Docker, Docker Compose, Nginx |

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 5.0+ (local or Atlas)
- Google Gemini API key (optional, for AI trivia)

### Quick Start (Local Dev)

```bash
# Clone the repository
git clone https://github.com/TheeGreenGenie/ticket_leader.git
cd ticket_leader

# Start MongoDB (if not running)
mongod --dbpath /path/to/data

# Backend
cd server
cp .env.example .env  # Configure environment variables
npm install
npm run dev           # Runs on http://127.0.0.1:5001

# Frontend (new terminal)
cd frontend
npm install
npm run dev           # Runs on http://127.0.0.1:4001
```

### Docker Setup

#### Prerequisites
- Docker Engine / Docker Desktop
- Docker Compose v2 (`docker compose version`)

#### Environment Setup
Create/edit these files before first run:

**`server/.env`** (required):
```env
MONGO_URI=mongodb://mongo:27017/ticketleader
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5001
CORS_ORIGINS=http://127.0.0.1:4001
RECAPTCHA_SECRET=your_recaptcha_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
TICKETMASTER_API_KEY=your_key_here
LASTFM_API_KEY=your_key_here
```

**`frontend/.env`** (required):
```env
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

#### Run

```bash
docker compose up --build -d
```

- App: `http://127.0.0.1:4001`
- API health: `http://127.0.0.1:5001/api/health`

#### Verify

```bash
docker compose ps
docker compose logs -f server
docker compose logs -f mongo
```

#### Populate Events

Seed local starter data:
```bash
docker compose exec -T server node scripts/seedDatabase.js
```

Sync large Ticketmaster dataset:
```bash
docker compose exec -T server node scripts/runSync.js
```

#### Stop

```bash
docker compose down

# Remove DB volume too:
docker compose down -v
```

#### Cross-Environment Notes
- This setup is portable across Windows, macOS, and Linux.
- For remote Linux servers, bind publicly with:
```bash
HOST_BIND_IP=0.0.0.0 docker compose up --build -d
```

## Project Structure

```
ticket_leader/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Page components (9 pages)
│   │   │   ├── LoginPage.jsx       # Auth with reCAPTCHA
│   │   │   ├── DashboardPage.jsx   # Event discovery
│   │   │   ├── LiveQueuePage.jsx   # Main queue experience
│   │   │   ├── StadiumPage.jsx     # 3D stadium navigation
│   │   │   ├── WalkthroughPage.jsx # Character walkthrough
│   │   │   ├── VerifyPage.jsx      # Biometric verification
│   │   │   └── ...
│   │   ├── components/         # Reusable UI components
│   │   │   ├── games/              # TriviaGame, PollGame
│   │   │   ├── queue/              # QueueStatus, TrustLevelBadge
│   │   │   └── ...
│   │   ├── stadium/            # 3D stadium components (17 files)
│   │   ├── api/                # API client modules
│   │   ├── services/           # Socket, location, TTS services
│   │   └── utils/              # Behavior collector, helpers
│   ├── Dockerfile
│   └── vite.config.js
│
├── server/                      # Node.js + Express backend
│   ├── routes/
│   │   ├── auth.js             # Signup, login, JWT
│   │   ├── queue.js            # Queue join, status, location
│   │   ├── games.js            # Game submission, trust scoring
│   │   ├── content.js          # Artists, events, trivia, polls
│   │   └── tts.js              # Text-to-speech API
│   ├── models/                 # MongoDB schemas (7 models)
│   ├── services/
│   │   ├── queueManager.js         # Queue logic
│   │   ├── trustScoreCalculator.js # Trust scoring
│   │   └── geminiService.js        # AI trivia generation
│   ├── sockets/                # Socket.IO handlers
│   ├── seeds/                  # Seed data (artists, events, trivia)
│   ├── Dockerfile
│   └── index.js
│
├── docker-compose.yml          # Multi-container orchestration
└── docs/                       # Additional documentation
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account with reCAPTCHA |
| POST | `/api/auth/login` | User login |

### Queue Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/queue/join` | Join event queue (requires trivia) |
| GET | `/api/queue/status/:sessionId` | Get queue position & trust |
| POST | `/api/queue/leave/:sessionId` | Leave queue |
| POST | `/api/queue/location/:sessionId` | Save geolocation data |
| POST | `/api/queue/reorder/:eventId` | Reorder by trust scores |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content/artists` | List all artists |
| GET | `/api/content/events` | Get active events |
| GET | `/api/content/artists/:id/trivia` | Get trivia (AI or static) |
| GET | `/api/content/artists/:id/trivia/local` | Location-themed trivia |
| GET | `/api/content/artists/:id/polls` | Get poll questions |

### Games & Trust
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games/submit` | Submit game result |
| GET | `/api/games/history/:sessionId` | Game history |
| POST | `/api/games/behavior/stream` | Record behavioral data |
| GET | `/api/games/trust/:sessionId` | Trust score breakdown |

## Trust Score System

| Action | Points |
|--------|--------|
| Base score | 50 |
| Easy trivia (correct) | +5 |
| Medium trivia (correct) | +10 |
| Hard trivia (correct) | +15 |
| Poll participation | +3-5 |
| Human-like response time (2-8s) | +2 bonus |
| Time in queue | +1/minute (max +20) |
| Suspicious IP | -20 |
| Bot-like behavior | -10 per flag |

### Trust Levels
- **Bronze**: 0-40 points
- **Silver**: 41-60 points (default)
- **Gold**: 61-80 points
- **Platinum**: 81-100 points

## 3D Stadium Controls

### Orbit Mode (Default)
- **Right-drag**: Rotate camera
- **Scroll**: Zoom in/out
- **Click section**: Highlight seats

### Walkthrough Mode
- **WASD**: Move character
- **O/L**: Float up/down
- **Space**: Snap to floor
- **Q/E**: Zoom camera
- **Arrow keys**: Rotate view
- **Left-drag**: Camera rotation

### Seat Finder
1. Enter section (L1-L54, C1-C22, U1-U36)
2. Optionally enter row and seat
3. Click "Find Seat" for 3D navigation with spoken directions

## Database Models

- **User** - Authentication credentials
- **QueueSession** - Queue position, trust score, behavioral data
- **Event** - Concert details, venue coordinates
- **Artist** - Artist profiles
- **TriviaQuestion** - Quiz questions with difficulty levels
- **PollQuestion** - Fan polls (choice or slider)
- **GameResult** - Game submissions and scores
- **BehavioralStream** - Mouse/scroll/click patterns

## Security Features

- JWT authentication (7-day expiry)
- bcrypt password hashing (10 rounds)
- reCAPTCHA verification
- WebAuthn biometric verification
- IP-based rate limiting
- CORS protection
- Session expiry cleanup (2+ hours)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Team

Built by the TicketLeader team for BisonHacks 2026.

## License

This project is licensed under the MIT License.
