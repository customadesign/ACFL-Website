# ACT Coaching For Life - Multi-Dashboard Setup

This project now includes three separate dashboards running on different ports:

## Port Structure

- **Backend API**: `http://localhost:3001` - Express.js API server
- **Members Dashboard**: `http://localhost:4000` - Client-facing dashboard for members
- **Coaches Dashboard**: `http://localhost:4002` - Dashboard for coaches to manage their practice
- **Admin Dashboard**: `http://localhost:4003` - Administrative dashboard for platform management

## Quick Start

### Option 1: Start All Services at Once
```bash
cd therapist-matcher
./start-all.sh
```

### Option 2: Start Services Individually

1. **Start Backend** (Port 3001):
```bash
cd backend
npm install
npm run dev
```

2. **Start Members Dashboard** (Port 4000):
```bash
cd frontend
npm install
npm run dev
```

3. **Start Coaches Dashboard** (Port 4002):
```bash
cd coaches-dashboard
npm install
npm run dev
```

4. **Start Admin Dashboard** (Port 4003):
```bash
cd admin-dashboard
npm install
npm run dev
```

### Option 3: Using Docker
```bash
docker-compose up
```

## Features by Dashboard

### Members Dashboard (Port 4000)
- Coach search and matching
- Saved coaches list
- Appointment scheduling
- Personal assessment form

### Coaches Dashboard (Port 4002)
- Coach profile management
- Appointment calendar
- Client management
- Session tracking
- Performance metrics

### Admin Dashboard (Port 4003)
- Platform overview and analytics
- Coach management
- Member management
- System administration

## Dependencies

Make sure you have:
- Node.js 18+
- npm or yarn
- Docker (optional, for containerized deployment)

## Development Notes

- All dashboards are built with Next.js and TypeScript
- Backend uses Express.js with TypeScript
- CORS is configured to allow cross-origin requests between all services
- Each dashboard is completely independent and can be developed/deployed separately

## Troubleshooting

If you encounter port conflicts:
```bash
# Check what's running on ports
lsof -i :3001
lsof -i :4000
lsof -i :4002
lsof -i :4003

# Kill processes if needed
kill -9 <PID>
```

## URLs for Easy Access

- Members Dashboard: http://localhost:4000
- Coaches Dashboard: http://localhost:4002  
- Admin Dashboard: http://localhost:4003
- Backend API: http://localhost:3001