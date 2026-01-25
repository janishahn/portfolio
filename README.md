# Portfolio Project

This project uses a FastAPI backend with a Vite + React + TypeScript frontend, served under the same origin.

## Structure
- `app/`: FastAPI app (`app.main:app`)
- `ui/`: Vite + React + TypeScript frontend
- `scripts/`: Dev workflow helpers

## Configuration
- Create a local `.env` (see `.env.example`).
- The frontend relies on same-origin `/api` requests in dev via the Vite proxy.

## Running Locally
Option A: one command (recommended)
```sh
uv run python scripts/dev.py
```

Option B: two processes
```sh
# Backend
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd ui
npm run dev -- --port 5173
```

## Production Build
```sh
cd ui
npm run build
cd ..
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The built SPA is served from `ui/dist` at `/`, and the API is served under `/api`.
