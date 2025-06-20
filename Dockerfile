# Multi-stage build for stock-pick-game monorepo
FROM node:18-alpine AS base

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Build frontend
FROM base AS frontend-builder
COPY packages/frontend/ ./packages/frontend/
RUN npm run build --workspace=frontend

# Build backend
FROM base AS backend-builder
COPY packages/backend/ ./packages/backend/
RUN npm run build --workspace=backend

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci --only=production

# Copy built applications
COPY --from=frontend-builder --chown=nodejs:nodejs /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/packages/backend/dist ./packages/backend/dist

# Copy backend source files (needed for database migrations)
COPY --from=backend-builder --chown=nodejs:nodejs /app/packages/backend/src ./packages/backend/src
COPY --from=backend-builder --chown=nodejs:nodejs /app/packages/backend/drizzle ./packages/backend/drizzle
COPY --from=backend-builder --chown=nodejs:nodejs /app/packages/backend/drizzle.config.ts ./packages/backend/

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/index.js"] 