import socket
import subprocess
import sys
import threading
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PORT_SCAN_LIMIT = 100


def port_available(port: int) -> bool:
    for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        with socket.socket(family, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
            except OSError:
                return False
    return True


def select_port(start_port: int) -> int:
    for port in range(start_port, start_port + PORT_SCAN_LIMIT):
        if port_available(port):
            return port
    print(
        f"Could not find an available port from {start_port} "
        f"to {start_port + PORT_SCAN_LIMIT - 1}.",
        file=sys.stderr,
    )
    sys.exit(1)


def stream_output(prefix: str, color: str, stream) -> None:
    for line in iter(stream.readline, ""):
        if not line:
            break
        sys.stdout.write(f"{color}{prefix}\033[0m {line.rstrip()}\n")
        sys.stdout.flush()


def main() -> None:
    backend_port = select_port(8000)
    frontend_port = select_port(5173)
    frontend_env = os.environ.copy()
    frontend_env["VITE_API_PROXY_TARGET"] = f"http://localhost:{backend_port}"

    backend_cmd = [
        "uv",
        "run",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--port",
        str(backend_port),
    ]
    frontend_cmd = [
        "npm",
        "run",
        "dev",
        "--",
        "--port",
        str(frontend_port),
        "--strictPort",
    ]

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
        env=frontend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    threads = [
        threading.Thread(
            target=stream_output, args=("[backend]", "\033[36m", backend.stdout)
        ),
        threading.Thread(
            target=stream_output, args=("[frontend]", "\033[35m", frontend.stdout)
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
