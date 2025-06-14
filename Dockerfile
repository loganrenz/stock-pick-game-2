# Use official Node.js image as the base
FROM node:20-alpine as build

WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy package files and install dependencies for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm install && npm rebuild bcrypt && cd ../frontend && npm install

# Copy backend and frontend source
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# --- Backend image ---
FROM node:20-alpine as backend
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY backend/prisma ./backend/prisma
COPY backend/.env_file ./backend/.env
EXPOSE 4556
CMD ["node", "backend/dist/index.js"]

# --- Frontend image ---
FROM node:20-alpine as frontend
WORKDIR /app/frontend
RUN apk add --no-cache openssl
COPY --from=build /app/frontend/dist ./dist
EXPOSE 5173
CMD ["npx", "serve", "-s", "dist", "-l", "tcp://0.0.0.0:5173", "--single", "--cors"] 