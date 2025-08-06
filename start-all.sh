#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting ACT Coaching For Life"
echo "=============================="

# Kill any existing processes on these ports
echo "Killing existing processes on ports 3001, 4000..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Start backend
echo "Starting backend server on port 3001..."
cd "$SCRIPT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend on port 4000..."
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "All services started!"
echo "====================="
echo "Backend API:        http://localhost:3001"
echo "Frontend:           http://localhost:4000"
echo ""
echo "Available routes:"
echo "  - Client Dashboard: http://localhost:4000/client-dashboard"
echo "  - Coach Dashboard:  http://localhost:4000/coach-dashboard" 
echo "  - Admin Dashboard:  http://localhost:4000/admin"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait