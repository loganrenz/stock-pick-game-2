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

# --- Final image ---
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and serve
RUN apk add --no-cache openssl && npm install -g serve

# Copy backend files
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/tsconfig.json ./backend/tsconfig.json

# Copy frontend build
COPY --from=build /app/frontend/dist ./frontend/dist

# Copy database
COPY --from=build /app/data /data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

# Expose ports
EXPOSE 4556
EXPOSE 5173

# Start both backend and frontend
CMD ["sh", "-c", "node backend/dist/index.js & serve -s frontend/dist -l tcp://0.0.0.0:5173 --single --cors"] 