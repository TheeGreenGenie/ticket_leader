# Docker Usage

## Prerequisites
- Docker Desktop running

## Start full stack
From repo root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://127.0.0.1:4001`
- Backend API: `http://127.0.0.1:5001/api/health`
- MongoDB: `mongodb://127.0.0.1:27017/ticketleader`

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
