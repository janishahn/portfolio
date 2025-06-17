#!/usr/bin/env python3

import sys
import logging

def start_server(host="0.0.0.0", port=8000, reload=True, debug=False):
    """Start the FastAPI server."""
    import uvicorn
    
    # Configure logging level based on debug flag
    if debug:
        logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        print("🐛 Debug logging enabled")
    else:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    print(f"Starting server at http://{host}:{port}")
    print("Press Ctrl+C to stop the server")
    
    try:
        uvicorn.run("main:app", host=host, port=port, reload=reload)
    except KeyboardInterrupt:
        print("\nServer stopped.")

def main():
    print("🚀 Starting Portfolio Backend")
    print("=" * 40)
    
    print("\n🌟 Starting FastAPI server...")
    
    # Parse command line arguments
    host = "0.0.0.0"
    port = 8000
    reload = True
    debug = False
    
    # Simple argument parsing
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg.startswith("--host="):
            host = arg.split("=", 1)[1]
        elif arg.startswith("--port="):
            port = int(arg.split("=", 1)[1])
        elif arg == "--no-reload":
            reload = False
        elif arg == "--debug":
            debug = True
        elif arg in ["-h", "--help"]:
            print("Usage: python start.py [options]")
            print("Options:")
            print("  --host=HOST     Server host (default: 0.0.0.0)")
            print("  --port=PORT     Server port (default: 8000)")
            print("  --no-reload     Disable auto-reload")
            print("  --debug         Enable debug logging")
            print("  -h, --help      Show this help message")
            sys.exit(0)
    
    # Start the server
    start_server(host, port, reload, debug)

if __name__ == "__main__":
    main() 