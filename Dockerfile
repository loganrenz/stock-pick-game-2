# Use Node.js 20 for better performance and security
FROM node:20-alpine AS base

# Install dependencies needed for node-gyp (for packages like bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all package.json files from the monorepo root and packages
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install all dependencies for the entire monorepo
# This is more efficient for caching layers
RUN npm ci

# Copy the rest of the source code
COPY . .

# --- Frontend Builder ---
# This stage builds the frontend application
FROM base AS frontend-builder
WORKDIR /app
# Build the frontend workspace
RUN npm run build --workspace=frontend

# --- Backend Builder ---
# This stage builds the backend application
FROM base AS backend-builder
WORKDIR /app
# Build the backend workspace
RUN npm run build --workspace=backend

# --- Production Stage ---
# This is the final, optimized image for production
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and process management
RUN apk add --no-cache dumb-init

# Create a non-root user and group for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 -g nodejs nodejs

WORKDIR /app

# Copy production node_modules from the base build stage
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
# Copy backend's package.json for context
COPY --chown=nodejs:nodejs packages/backend/package.json ./packages/backend/

# Copy the built backend application from the builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/packages/backend/dist ./packages/backend/dist

# Copy the built frontend files from the frontend builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/packages/frontend/dist ./packages/frontend/dist

# Create and set permissions for data and log directories
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs
VOLUME /app/data

# Switch to the non-root user
USER nodejs

# Expose the new port for the backend service
EXPOSE 6969

# Health check to ensure the service is running correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6969/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to start the application, ensuring proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Command to run the backend application
CMD ["node", "packages/backend/dist/index.js"] 