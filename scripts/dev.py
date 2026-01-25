#!/usr/bin/env python3

import socket
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def stream_output(prefix: str, color: str, stream) -> None:
    for line in iter(stream.readline, ""):
        if not line:
            break
        sys.stdout.write(f"{color}{prefix}{line.rstrip()}\033[0m\n")
        sys.stdout.flush()


def main() -> None:
    backend_port = 8000
    frontend_port = 5173

    if not port_available(backend_port):
        print(f"Port {backend_port} is already in use.")
        sys.exit(1)
    if not port_available(frontend_port):
        print(f"Port {frontend_port} is already in use.")
        sys.exit(1)

    backend_cmd = [
        "uv",
        "run",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--port",
        str(backend_port),
    ]
    frontend_cmd = ["npm", "run", "dev", "--", "--port", str(frontend_port)]

    backend = subprocess.Popen(
        backend_cmd,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    frontend = subprocess.Popen(
        frontend_cmd,
        cwd=ROOT / "ui",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    threads = [
        threading.Thread(
            target=stream_output, args=("[backend] ", "\033[36m", backend.stdout)
        ),
        threading.Thread(
            target=stream_output, args=("[frontend] ", "\033[35m", frontend.stdout)
        ),
    ]
    for thread in threads:
        thread.daemon = True
        thread.start()

    print("Dev servers running:")
    print(f"- API: http://localhost:{backend_port}/api")
    print(f"- UI:  http://localhost:{frontend_port}")

    try:
        backend.wait()
        frontend.wait()
    except KeyboardInterrupt:
        backend.terminate()
        frontend.terminate()
        backend.wait()
        frontend.wait()


if __name__ == "__main__":
    main()
