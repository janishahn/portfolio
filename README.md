# Portfolio Project

This project is modular, with a FastAPI backend and a Next.js frontend, designed to be served via Nginx locally.

## Structure
- **backend/**: FastAPI app (Python)
- **frontend/**: Next.js app (React/TypeScript)

## Configuration
- **Backend**: Port can be set via command line (`python start.py --port=8000`).
- **Frontend**: Port and backend API URL are set in `frontend/.env.local` (see `frontend/.env.local.example`).
- **Nginx**: Proxies `/api` to backend, `/` to frontend. Example config:
  ```nginx
  server {
      listen 8080;
      location /api/ {
          proxy_pass http://localhost:8000/api/;
      }
      location / {
          proxy_pass http://localhost:3000/;
      }
  }
  ```

## Running Locally
1. Start the backend:
   ```sh
   cd backend
   python start.py --port=8000
   ```
2. Start the frontend:
   ```sh
   cd frontend
   npm run dev
   ```
3. Access the app via Nginx at [http://localhost:8080](http://localhost:8080) 