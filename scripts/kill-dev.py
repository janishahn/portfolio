#!/usr/bin/env python3

import subprocess


def main() -> None:
    subprocess.run(["pkill", "-f", "uvicorn"], check=False)
    subprocess.run(["pkill", "-f", "vite"], check=False)


if __name__ == "__main__":
    main()
