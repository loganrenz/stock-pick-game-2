# Use official Node.js image as the base
FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm install && cd ../frontend && npm install

# Build frontend
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy backend source
COPY backend ./backend

# Build backend
RUN cd backend && npm run build


# Production image
FROM node:20-alpine
WORKDIR /app

# Copy built backend and frontend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/frontend/dist ./frontend/dist

# Copy backend prisma and .env
COPY backend/prisma ./backend/prisma
COPY backend/.env_file ./backend/.env


# Expose ports
EXPOSE 4556 5173

# Start backend and serve frontend
CMD ["sh", "-c", "node backend/dist/index.js & npx serve -s frontend/dist -l 0.0.0.0:5173"] 