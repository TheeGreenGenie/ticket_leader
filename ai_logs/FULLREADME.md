# TicketLeader Full Setup Guide (Any Device)

This guide is for setting up the project on Windows, macOS, or Linux.

## 1. Prerequisites

Install these first:

- `git` (latest)
- `Node.js` 20+ (includes `npm`)
- `Docker Desktop` (recommended path) or Docker Engine + Compose
- A code editor (VS Code recommended)

Optional for full feature support:

- MongoDB Atlas account
- Google AI Studio key (`GEMINI_API_KEY`)
- Ticketmaster API key
- Last.fm API key

## 2. Clone the Repository

```bash
git clone https://github.com/TheeGreenGenie/ticket_leader.git
cd ticket_leader
```

## 3. Choose a Setup Path

Use one of these:

- Docker setup: fastest and most consistent across devices.
- Local setup: useful if you want direct control of frontend/backend processes.

---

## 4. Docker Setup (Recommended)

### 4.1 Create environment file

```bash
cp server/.env.example server/.env
```

If `cp` does not work on PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

### 4.2 Fill in `server/.env`

At minimum, set:

- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `CORS_ORIGINS`

Common values:

- `PORT=5001` (or leave default if your compose file sets it)
- `CORS_ORIGINS=http://localhost:4001`
- `GEMINI_MODEL=gemini-2.5-flash`

### 4.3 Start containers

```bash
docker compose up --build
```

Run detached (optional):

```bash
docker compose up --build -d
```

### 4.4 Seed and sync data (if needed)

```bash
docker compose exec -T server node scripts/seedDatabase.js
docker compose exec -T server node scripts/runSync.js
```

### 4.5 Open the app

- Frontend: `http://127.0.0.1:4001`
- API health: `http://127.0.0.1:5001/api/health`

---

## 5. Local Setup (No Docker)

### 5.1 Install dependencies

From repo root:

```bash
npm install
```

If root install is not configured for workspaces, install per app:

```bash
cd server && npm install
cd ../frontend && npm install
```

### 5.2 Configure environment

Create:

- `server/.env` (from `server/.env.example`)

Set required server env vars:

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGINS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `TICKETMASTER_API_KEY`
- `LASTFM_API_KEY`

Frontend env (if used in this repo setup):

- `VITE_API_BASE_URL=http://localhost:5001/api`
- `VITE_SOCKET_URL=http://localhost:5001`

### 5.3 Run backend

```bash
cd server
npm run dev
```

### 5.4 Run frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

### 5.5 Open local URLs

- Frontend: usually `http://localhost:4001` (or Vite default shown in terminal)
- Backend: usually `http://localhost:5001`

---

## 6. Verify Everything Works

Quick checks:

- API health endpoint returns success.
- You can load login/dashboard/live queue pages.
- Socket updates work in live queue.
- Trivia questions load for queue join.

If using seed scripts, confirm sample artists/events appear.

---

## 7. Production Deployment Notes

Current project pattern:

- Frontend on Vercel
- Backend on Render
- MongoDB on Atlas

Use production env vars:

- `CORS_ORIGINS=https://your-frontend-domain`
- `PORT` from host provider
- secure `JWT_SECRET`

---

## 8. Troubleshooting

### Port already in use

- Change local ports in env/config.
- Stop conflicting services.

### Docker build memory issues

Try:

- increase Docker memory allocation
- set build memory flags if needed

### CORS errors

- Ensure frontend URL is listed in `CORS_ORIGINS`.
- Confirm protocol and domain exactly match.

### Mongo connection failures

- Verify Atlas IP allowlist.
- Verify username/password in `MONGO_URI`.
- Check network access policy.

### Missing AI trivia

- Confirm `GEMINI_API_KEY`.
- Confirm `GEMINI_MODEL=gemini-2.5-flash`.

---

## 9. Useful Commands

```bash
# start
docker compose up --build

# stop
docker compose down

# server logs
docker compose logs -f server

# frontend logs
docker compose logs -f frontend
```

---

## 10. Team Workflow

```bash
git checkout -b feature/my-change
# code and commit
git push origin feature/my-change
```

Open a PR into `main`, review, merge, and deploy.
