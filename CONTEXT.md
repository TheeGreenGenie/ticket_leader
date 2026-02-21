# TicketLeader — Project Context

## Overview
TicketLeader is a ticketing platform. The frontend is a React app (Vite) and the backend is a Node/Express server backed by MongoDB. Authentication uses bcrypt for password hashing and JWTs for session tokens.

---

## Project Structure

```
BisonHacks/
├── base.html             # Original dashboard template (reference only)
├── login.html            # Original login template (reference only)
├── styles.css            # Original stylesheet (reference only)
├── frontend/             # React + Vite app
│   ├── index.html
│   ├── vite.config.js    # Dev server + /api proxy to localhost:5000
│   └── src/
│       ├── main.jsx              # ReactDOM entry point
│       ├── App.jsx               # Router: / → LoginPage, /dashboard → DashboardPage
│       ├── api/
│       │   └── auth.js           # login() / signup() — POST /api/auth/*
│       ├── pages/
│       │   ├── LoginPage.jsx     # Mirrors login.html (hero banner, Login/Sign Up buttons + inline forms)
│       │   └── DashboardPage.jsx # Mirrors base.html (protected route)
│       ├── components/
│       │   ├── Header.jsx        # TicketLeader header + settings button
│       │   ├── Navbar.jsx        # Hover dropdown navigation
│       │   └── Footer.jsx        # Shared footer
│       └── styles/
│           └── styles.css        # Ported from root styles.css + auth form styles
└── server/               # Node/Express + MongoDB backend
    ├── index.js          # Express app, MongoDB connection, listens on PORT 5000
    ├── .env              # Secrets (gitignored) — see .env.example
    ├── .env.example      # Template: MONGO_URI, JWT_SECRET, PORT
    └── routes/
        └── auth.js       # POST /api/auth/signup  |  POST /api/auth/login
```

> `backend/` — legacy folder, not integrated yet. Will be merged in a future phase.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios |
| Backend   | Node.js, Express 4                  |
| Database  | MongoDB (Mongoose)                  |
| Auth      | bcryptjs (hashing), jsonwebtoken (JWT, 7d expiry) |

---

## API Endpoints

Base URL (dev): `http://localhost:5000`

| Method | Path                  | Body                          | Response                        |
|--------|-----------------------|-------------------------------|---------------------------------|
| POST   | `/api/auth/signup`    | `{ name, email, password }`   | `{ token, user }` or error      |
| POST   | `/api/auth/login`     | `{ email, password }`         | `{ token, user }` or error      |
| GET    | `/api/health`         | —                             | `{ status: "ok" }`             |

---

## Auth Flow

1. User visits `/` → `LoginPage` renders (mirrors `login.html`)
2. User clicks **Login** or **Sign Up** → inline form appears below the buttons
3. Form submits → calls `src/api/auth.js` → POST to backend
4. On success: JWT stored in `localStorage` as `token`, redirect to `/dashboard`
5. `DashboardPage` checks `localStorage.getItem('token')` on mount — redirects to `/` if missing

---

## Environment Variables (`server/.env`)

```
MONGO_URI=mongodb://localhost:27017/ticketleader
JWT_SECRET=ticketleader_super_secret_change_me_in_production
PORT=5000
```

---

## Running Locally

**Terminal 1 — Backend** (requires MongoDB running):
```bash
cd server
npm run dev        # uses nodemon
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev        # starts at http://localhost:5173
```

Vite proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues in development.

---

## Key Decisions

- **`frontend/` is the canonical frontend.** The root `base.html`, `login.html`, and `styles.css` are reference files only — the React components mirror their structure exactly.
- **JWT in localStorage** — simple for now; can be upgraded to httpOnly cookies when needed.
- **`backend/` folder is untouched** — will be integrated separately in a future phase.
- **Proxy in `vite.config.js`** — keeps the frontend API calls at `/api/*` so switching from dev to prod only requires changing the proxy target or a base URL env var.
