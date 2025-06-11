#!/usr/bin/env python3
import subprocess
import sys
import os
import signal
import time
from threading import Thread

def run_backend():
    """Run the Flask backend server"""
    os.chdir('backend')
    subprocess.run([sys.executable, 'app.py'])

def run_frontend():
    """Run the React frontend development server"""
    time.sleep(2)  # Give backend time to start
    subprocess.run(['npm', 'run', 'dev'])

def main():
    print("🚀 Starting City Life Pharmacy Weight Loss Application...")
    print("📋 Frontend: React with professional styling")
    print("⚡ Backend: Flask with email & ShipStation integration")
    print("-" * 50)
    
    # Start backend in a separate thread
    backend_thread = Thread(target=run_backend, daemon=True)
    backend_thread.start()
    
    # Start frontend in main thread
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down application...")
        sys.exit(0)

if __name__ == "__main__":
    main()