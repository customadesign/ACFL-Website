#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting ACT Coaching For Life - All Dashboards"
echo "=============================================="

# Kill any existing processes on these ports
echo "Killing existing processes on ports 3001, 4000, 4002, 4003..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:4003 | xargs kill -9 2>/dev/null || true

# Start backend
echo "Starting backend server on port 3001..."
cd "$SCRIPT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start members dashboard (frontend)
echo "Starting members dashboard on port 4000..."
cd "$SCRIPT_DIR/frontend" && npm run dev &
MEMBERS_PID=$!

# Start coaches dashboard
echo "Starting coaches dashboard on port 4002..."
cd "$SCRIPT_DIR/coaches-dashboard" && npm run dev &
COACHES_PID=$!

# Start admin dashboard
echo "Starting admin dashboard on port 4003..."
cd "$SCRIPT_DIR/admin-dashboard" && npm run dev &
ADMIN_PID=$!

echo ""
echo "All services started!"
echo "====================="
echo "Backend API:        http://localhost:3001"
echo "Members Dashboard:  http://localhost:4000"
echo "Coaches Dashboard:  http://localhost:4002"
echo "Admin Dashboard:    http://localhost:4003"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo 'Stopping all services...'; kill $BACKEND_PID $MEMBERS_PID $COACHES_PID $ADMIN_PID 2>/dev/null; exit" INT
wait