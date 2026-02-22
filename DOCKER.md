# Docker Usage

## Prerequisites
- Docker Engine / Docker Desktop running
- Compose v2 (`docker compose version`)

## Start full stack
From repo root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://127.0.0.1:4001`
- Backend API: `http://127.0.0.1:5001/api/health`
- MongoDB: `mongodb://127.0.0.1:27017/ticketleader`

## Cross-Platform Notes
- This compose file is portable to Linux/macOS/Windows.
- It avoids host-specific paths and uses relative build contexts.
- Port bindings are configurable with env vars:
  - `HOST_BIND_IP` (default `127.0.0.1`)
  - `FRONTEND_PORT` (default `4001`)
  - `SERVER_PORT` (default `5001`)
  - `MONGO_PORT` (default `27017`)
- For remote Linux servers, use `HOST_BIND_IP=0.0.0.0`.

## Required Environment
- `server/.env` must define:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `RECAPTCHA_SECRET`
- `frontend/.env` should define:
  - `VITE_RECAPTCHA_SITE_KEY`

The server now runs a preflight check (`npm prestart`) and will fail fast if required env vars/dependencies are missing.

## Stop
```bash
docker compose down
```

## Stop and remove DB volume
```bash
docker compose down -v
```

## Notes
- Compose forces backend `MONGO_URI` to `mongodb://mongo:27017/ticketleader`.
- CORS is controlled by `CORS_ORIGINS` (comma-separated).
- Frontend Nginx proxies `/api` and `/socket.io` to backend service `server`.
- Socket endpoint can be overridden with `VITE_SOCKET_URL` during frontend build.
- All services include healthchecks; frontend waits for healthy backend.
