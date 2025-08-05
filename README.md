# Patient-Provider Matching Web Application

A full-stack application that matches patients with mental health providers based on their preferences and needs. The project is structured with a Next.js frontend and Express backend, containerized with Docker.

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Material UI
- Tailwind CSS

### Backend
- Node.js/Express
- TypeScript
- CSV data store

### Infrastructure
- Docker
- Docker Compose

## Prerequisites

- Docker
- Docker Compose

## Setup & Installation

1. Clone the repository
2. Navigate to the project root directory (where `docker-compose.yml` is located)

## Running the Application

Start both frontend and backend services:

```bash
docker-compose up --build
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### POST /api/match
Matches patients with providers based on preferences

Sample provider data is stored in `backend/src/data/providers.csv`.

## Matching Algorithm

The matching service weighs several factors in order of importance:
1. Primary Criteria
   - Areas of concern
   - Payment method
   - Availability
   - Gender preference
2. Language match
3. Provider Demographics
   - Treatment modalities
   - Specialties
   - Location (exact match or neighboring state)

Unit tests can be found in `backend/src/tests/matchingService.test.ts`.

## Project Structure

```
.
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── next.config.js
└── backend/
    ├── Dockerfile
    ├── src/
    │   ├── routes/
    │   ├── services/
    │   └── data/
    └── tests/
```

Please let me know if you'd like me to expand any section or add more details about specific components.

