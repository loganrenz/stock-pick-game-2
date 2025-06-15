# Use official Node.js image as the base
FROM node:20-alpine as build

WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy backend files
COPY backend/package*.json backend/
COPY backend/prisma backend/prisma/
COPY backend/src backend/src/
COPY backend/tsconfig.json backend/

# Copy frontend files
COPY frontend/package*.json frontend/
COPY frontend/src frontend/src/
COPY frontend/public frontend/public/
COPY frontend/tsconfig.json frontend/
COPY frontend/tsconfig.app.json frontend/
COPY frontend/tsconfig.node.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/index.html frontend/

# Install dependencies and build
RUN cd backend && npm install && npm rebuild bcrypt && cd ../frontend && npm install

# Generate Prisma client and set up database
RUN cd backend && \
    npx prisma generate && \
    mkdir -p /data && \
    touch /data/dev.db && \
    chown -R node:node /data

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# --- Backend image ---
FROM node:20-slim

WORKDIR /app

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/node_modules ./node_modules

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]

# --- Frontend image ---
FROM node:20-alpine as frontend
WORKDIR /app/frontend
RUN apk add --no-cache openssl
COPY --from=build /app/frontend/dist ./dist
EXPOSE 5173
CMD ["npx", "serve", "-s", "dist", "-l", "tcp://0.0.0.0:5173", "--single", "--cors"] 