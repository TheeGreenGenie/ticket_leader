<div align="center">

# 🎫 TicketLeader

### The Queue IS the Show.

**AI-powered mini-games verify fans, not CAPTCHAs — then a voice-guided 3D walkthrough gets every fan to their seat.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.4-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

*Built for BisonHacks 2026 · Howard University · Theme: Leveraging AI for Truth & Service*

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Trust Score System](#-trust-score-system)
- [3D Stadium Controls](#-3d-stadium-controls)
- [Database Models](#-database-models)
- [Security](#-security)
- [Team](#-team)

---

## ✨ Features

### 🎮 Live Queue System
> Real-time queue with gamified bot detection — fans play, bots get caught.

- Real-time queue position updates via WebSocket
- Trust score-based queue prioritization
- Estimated wait time calculations
- Session persistence across page reloads

### 🛡️ Multi-Layer Bot Detection

| Layer | Method | Description |
|:-----:|--------|-------------|
| 1 | **reCAPTCHA** | Google reCAPTCHA on signup/login |
| 2 | **Trivia Gate** | Artist knowledge verification before queue entry |
| 3 | **IP Flagging** | Detects multiple sessions from same IP |
| 4 | **Response Analysis** | Penalizes instant/bot-like responses |
| 5 | **Behavioral Tracking** | Mouse movement, scroll patterns, click analysis |
| 6 | **Biometric Verification** | WebAuthn (Face ID/Touch ID) for flagged users |

### 🏆 Gamification

- **Trivia Games** — 10-second timer, difficulty-based rewards (+5 to +15 trust)
- **Fan Polls** — Vote on artist topics (+3 to +5 trust)
- **Trust Levels** — Bronze → Silver → Gold → Platinum tiers
- **AI-Generated Questions** — Google Gemini creates dynamic, location-aware trivia

### 🏟️ 3D Stadium Experience

- Interactive 80,000-seat stadium visualization (AT&T Stadium)
- Three navigation modes: **Orbit**, **Walkthrough**, **Parking**
- Seat finder with spoken directions (TTS)
- Real-time distance and ETA calculations
- Section highlighting and path routing

### 📍 Location Features

- Geolocation-based local fan verification
- Distance calculation to venue (Haversine formula)
- Local trivia questions for nearby fans
- Trust boost for verified local attendance

---

## 🛠️ Tech Stack

```
Frontend          Backend           AI & Auth          DevOps
─────────         ─────────         ─────────          ─────────
React 19          Node.js           Gemini 1.5 Flash   Docker
Vite 7            Express 4         JWT + bcrypt       Docker Compose
Three.js          MongoDB 8         reCAPTCHA          Nginx
R3F + Drei        Mongoose          WebAuthn
Socket.IO Client  Socket.IO
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+
- **MongoDB** 5.0+ (local or Atlas)
- **Google Gemini API key** (optional, for AI trivia)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/TheeGreenGenie/ticket_leader.git
cd ticket_leader
```

**Backend:**
```bash
cd server
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # http://127.0.0.1:5001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev             # http://127.0.0.1:4001
```

### 🐳 Docker Setup

```bash
docker compose up --build

# Frontend:  http://127.0.0.1:4001
# Backend:   http://127.0.0.1:5001
# MongoDB:   mongodb://127.0.0.1:27017
```

### Environment Variables

<details>
<summary><b>Server</b> (<code>server/.env</code>)</summary>

```env
MONGO_URI=mongodb://127.0.0.1:27017/ticketleader
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5001
CORS_ORIGINS=http://127.0.0.1:4001
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
RECAPTCHA_SECRET=your_recaptcha_secret
```

</details>

<details>
<summary><b>Frontend</b> (<code>frontend/.env</code>)</summary>

```env
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

</details>

---

## 📁 Project Structure

```
ticket_leader/
│
├── 🎨 frontend/                    # React + Vite
│   ├── src/
│   │   ├── pages/                  # 9 page components
│   │   │   ├── LoginPage.jsx       # Auth with reCAPTCHA
│   │   │   ├── DashboardPage.jsx   # Event discovery
│   │   │   ├── LiveQueuePage.jsx   # Main queue experience
│   │   │   ├── StadiumPage.jsx     # 3D stadium navigation
│   │   │   ├── WalkthroughPage.jsx # Character walkthrough
│   │   │   ├── VerifyPage.jsx      # Biometric verification
│   │   │   └── ...
│   │   ├── components/             # Reusable UI
│   │   │   ├── games/              # TriviaGame, PollGame
│   │   │   └── queue/              # QueueStatus, TrustLevelBadge
│   │   ├── stadium/                # 3D stadium components (17 files)
│   │   ├── api/                    # API client modules
│   │   ├── services/               # Socket, location, TTS
│   │   └── utils/                  # Behavior collector, helpers
│   └── Dockerfile
│
├── ⚙️ server/                      # Node.js + Express
│   ├── routes/
│   │   ├── auth.js                 # Signup, login, JWT
│   │   ├── queue.js                # Queue join, status, location
│   │   ├── games.js                # Game submission, trust scoring
│   │   ├── content.js              # Artists, events, trivia, polls
│   │   └── tts.js                  # Text-to-speech API
│   ├── models/                     # MongoDB schemas (7 models)
│   ├── services/
│   │   ├── queueManager.js         # Queue logic
│   │   ├── trustScoreCalculator.js # Trust scoring
│   │   └── geminiService.js        # AI trivia generation
│   ├── sockets/                    # Socket.IO handlers
│   ├── seeds/                      # Seed data
│   └── Dockerfile
│
├── docker-compose.yml
└── docs/
```

---

## 🔌 API Endpoints

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create account with reCAPTCHA |
| `POST` | `/api/auth/login` | User login |

</details>

<details>
<summary><b>Queue Management</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/queue/join` | Join event queue (requires trivia) |
| `GET` | `/api/queue/status/:sessionId` | Get queue position & trust |
| `POST` | `/api/queue/leave/:sessionId` | Leave queue |
| `POST` | `/api/queue/location/:sessionId` | Save geolocation data |
| `POST` | `/api/queue/reorder/:eventId` | Reorder by trust scores |

</details>

<details>
<summary><b>Content</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/content/artists` | List all artists |
| `GET` | `/api/content/events` | Get active events |
| `GET` | `/api/content/artists/:id/trivia` | Get trivia (AI or static) |
| `GET` | `/api/content/artists/:id/trivia/local` | Location-themed trivia |
| `GET` | `/api/content/artists/:id/polls` | Get poll questions |

</details>

<details>
<summary><b>Games & Trust</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/games/submit` | Submit game result |
| `GET` | `/api/games/history/:sessionId` | Game history |
| `POST` | `/api/games/behavior/stream` | Record behavioral data |
| `GET` | `/api/games/trust/:sessionId` | Trust score breakdown |

</details>

---

## 📊 Trust Score System

```
                    ┌─────────────────────────┐
                    │     BASE SCORE: 50      │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
    │  TRIVIA   │          │   POLLS   │          │ BEHAVIOR  │
    │ +5 / +10  │          │  +3 / +5  │          │  +2 bonus │
    │   / +15   │          │           │          │ or -10    │
    └───────────┘          └───────────┘          └───────────┘
```

| Action | Points |
|--------|:------:|
| Base score | `50` |
| Easy trivia ✅ | `+5` |
| Medium trivia ✅ | `+10` |
| Hard trivia ✅ | `+15` |
| Poll participation | `+3 to +5` |
| Human-like response (2-8s) | `+2 bonus` |
| Time in queue | `+1/min (max +20)` |
| Suspicious IP | `-20` |
| Bot-like behavior | `-10 per flag` |

### Trust Levels

| Tier | Score | Badge |
|------|:-----:|:-----:|
| 🥉 Bronze | 0–40 | Needs verification |
| 🥈 Silver | 41–60 | Default |
| 🥇 Gold | 61–80 | Trusted fan |
| 💎 Platinum | 81–100 | Verified superfan |

---

## 🏟️ 3D Stadium Controls

### Orbit Mode (Default)
| Action | Control |
|--------|---------|
| Rotate camera | Right-drag |
| Zoom | Scroll wheel |
| Select section | Click |

### Walkthrough Mode
| Action | Control |
|--------|---------|
| Move | `W` `A` `S` `D` |
| Float up / down | `O` / `L` |
| Snap to floor | `Space` |
| Zoom camera | `Q` / `E` |
| Rotate view | Arrow keys |
| Camera rotation | Left-drag |

### Seat Finder
1. Enter section (`L1`–`L54`, `C1`–`C22`, `U1`–`U36`)
2. Optionally enter row and seat number
3. Click **"Find Seat"** for 3D navigation with spoken directions

---

## 🗄️ Database Models

| Model | Purpose |
|-------|---------|
| `User` | Authentication credentials |
| `QueueSession` | Queue position, trust score, behavioral data |
| `Event` | Concert details, venue coordinates |
| `Artist` | Artist profiles |
| `TriviaQuestion` | Quiz questions with difficulty levels |
| `PollQuestion` | Fan polls (choice or slider) |
| `GameResult` | Game submissions and scores |
| `BehavioralStream` | Mouse/scroll/click patterns |

---

## 🔒 Security

- **JWT** authentication (7-day expiry)
- **bcrypt** password hashing (10 rounds)
- **Google reCAPTCHA** verification
- **WebAuthn** biometric verification (Face ID / Touch ID)
- **IP-based** rate limiting
- **CORS** protection
- **Session expiry** cleanup (2+ hours)

---

## 👥 Team

Built by the **TicketLeader** team for **BisonHacks 2026** at Howard University.

| Contributor | GitHub |
|-------------|--------|
| Soloman Shasanmi | [@TheeGreenGenie](https://github.com/TheeGreenGenie) |
| joslew22 | [@joslew22](https://github.com/joslew22) |
| danieladewale | [@danieladewale](https://github.com/danieladewale) |
| masonbrogden | [@masonbrogden](https://github.com/masonbrogden) |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

*Built with ❤️ at Howard University · BisonHacks 2026*

**AI for Truth & Service**

</div>
