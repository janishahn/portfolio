# AGENTS.md

This file defines the ground-truth development guidelines for this repo.

## Stack (Ground Truth)
- Backend: FastAPI on Python 3.11+ with uv for dependency management and tooling
- Server: Uvicorn (reload in dev)
- Config: `.env` for secrets/config and `.env.example` checked in
- HTTP client + settings: httpx, pydantic-settings
- Frontend: Vite + React + TypeScript
- Styling: Tailwind CSS
- Component system: shadcn/ui on top of Radix UI
- Icons: lucide-react
- Utility libs: clsx + tailwind-merge, tw-animate-css, cmdk (when needed)

## Same-Origin Routing (No CORS)
- API lives under `/api/*` (FastAPI router prefix)
- SPA is served at `/` by FastAPI via `StaticFiles(..., html=True)`
- No CORS configuration in either dev or prod

## Repo Layout
- Backend lives under `app/` and exposes `app.main:app`
- Frontend lives under `ui/`
- `ui/dist/` is a build artifact and should not be committed

## Development Workflow (Two Processes)
- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `vite` dev server on port 5173
- Vite dev server proxies `/api` to `http://localhost:8000` (including WebSockets)
- `scripts/dev.py` starts both servers and checks ports
- `scripts/kill-dev.py` terminates dev processes

## Production Workflow (One Process)
- Build SPA into `ui/dist`
- Run `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- A minimal `start.sh` can activate the venv and run uvicorn

## UI Guidelines
- Use prebuilt shadcn/ui components and Radix primitives for consistent visuals
- Avoid custom one-off UI components when a shadcn/ui equivalent exists
- Use lucide-react for icons

## Code Style
- Prefer straight-line, local code; avoid micro-helpers
- Avoid defensive type handling and runtime type probing
- Be sure of types at boundaries and then code assuming those types
- Do not use broad exception catching; handle only specific exceptions
- Keep comments minimal and only when clarity demands it

## Tooling and Formatting
- Use `uv` for Python dependencies and task execution
- Ruff formatting is mandatory and must be run in two steps:
  1) `uv run ruff check --fix .`
  2) `uv run ruff format .`
