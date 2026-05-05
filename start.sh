#!/bin/bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/Documents/portfolio}"
PORT="${PORT:-8000}"

cd "$PROJECT_DIR"
source .venv/bin/activate
uvicorn app.main:app --port "$PORT" --host 0.0.0.0 --proxy-headers --forwarded-allow-ips 127.0.0.1
