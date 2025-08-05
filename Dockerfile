# Stage 1: Frontend Builder
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Backend Builder
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine
WORKDIR /app

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/src/data ./backend/dist/data

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --only=production
WORKDIR /app/frontend
RUN npm ci --only=production

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose backend port
EXPOSE 3001

# Start the backend server
CMD ["node", "backend/dist/index.js"] 