#!/bin/bash

# Stock Pick Game Safe Deployment Script
# Industry standard deployment with validation, backup, and rollback

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/root/stock-pick-game-2"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Rollback function
rollback() {
    print_error "Deployment failed! Starting rollback..."
    
    # Stop new containers
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    
    # Restore from backup if available
    if [ -n "$BACKUP_TIMESTAMP" ] && [ -d "/root/database-backups/$BACKUP_TIMESTAMP" ]; then
        print_status "Restoring database from backup: $BACKUP_TIMESTAMP"
        cp "/root/database-backups/$BACKUP_TIMESTAMP/stock-pick-game.db" "$APP_DIR/data/"
    fi
    
    # Start with previous image
    print_status "Starting rollback containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_error "💥 Deployment rolled back! Check logs and try again."
    exit 1
}

# Set trap for rollback on error
trap rollback ERR

print_status "🚀 Starting safe deployment process..."

# Change to app directory
cd "$APP_DIR"

# Step 1: Pre-deployment validation
print_status "Step 1: Pre-deployment validation"

# Validate current database
print_info "Validating current database..."
if ! "$SCRIPT_DIR/validate-database.sh" "$APP_DIR/data/stock-pick-game.db"; then
    print_error "Current database validation failed!"
    exit 1
fi

# Check Docker and docker-compose
print_info "Checking Docker services..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running!"
    exit 1
fi

if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "docker-compose not found!"
    exit 1
fi

# Step 2: Create backup
print_status "Step 2: Creating pre-deployment backup"
if ! "$SCRIPT_DIR/backup-database.sh"; then
    print_error "Backup creation failed!"
    exit 1
fi

# Get backup timestamp for potential rollback
BACKUP_TIMESTAMP=$(ls -t /root/database-backups/ | head -1)
print_info "Backup created: $BACKUP_TIMESTAMP"

# Step 3: Pull latest image
print_status "Step 3: Pulling latest application image"
if ! docker-compose -f "$COMPOSE_FILE" pull; then
    print_error "Failed to pull latest image!"
    exit 1
fi

# Step 4: Graceful shutdown
print_status "Step 4: Stopping current application"
docker-compose -f "$COMPOSE_FILE" down

# Step 5: Start new deployment
print_status "Step 5: Starting new deployment"
docker-compose -f "$COMPOSE_FILE" up -d

# Step 6: Health checks
print_status "Step 6: Performing health checks"

# Wait for application to start
print_info "Waiting for application to start..."
sleep 15

# Check if container is running
if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_error "Container failed to start!"
    exit 1
fi

# Health check endpoint
print_info "Checking application health..."
for i in {1..12}; do
    if curl -f http://localhost:6969/health > /dev/null 2>&1; then
        print_status "✅ Application health check passed"
        break
    fi
    
    if [ "$i" -eq 12 ]; then
        print_error "Health check failed after 60 seconds"
        exit 1
    fi
    
    print_info "Waiting for health check... (attempt $i/12)"
    sleep 5
done

# Validate database connectivity
print_info "Validating database connectivity..."
sleep 5

# Test API endpoints
if curl -f http://localhost:6969/api/weeks > /dev/null 2>&1; then
    print_status "✅ Database connectivity verified"
else
    print_error "Database connectivity test failed"
    exit 1
fi

# Step 7: Post-deployment validation
print_status "Step 7: Post-deployment validation"

# Validate database after deployment
if ! "$SCRIPT_DIR/validate-database.sh" "$APP_DIR/data/stock-pick-game.db"; then
    print_error "Post-deployment database validation failed!"
    exit 1
fi

# Show deployment info
print_info "Deployment information:"
print_info "  Container status:"
docker-compose -f "$COMPOSE_FILE" ps

print_info "  Application logs (last 10 lines):"
docker-compose -f "$COMPOSE_FILE" logs --tail=10 app

print_info "  Database statistics:"
sqlite3 "$APP_DIR/data/stock-pick-game.db" "
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Weeks: ' || COUNT(*) FROM weeks;
SELECT 'Picks: ' || COUNT(*) FROM picks;
"

# Clear trap (deployment successful)
trap - ERR

print_status "🎉 Deployment completed successfully!"
print_info "Application is running at: https://stockpickgame.tideye.com"
print_info "Backup available at: /root/database-backups/$BACKUP_TIMESTAMP" 