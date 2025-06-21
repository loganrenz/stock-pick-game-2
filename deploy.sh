#!/bin/bash

# Stock Pick Game Production Deployment Script
set -e

echo "🚀 Starting Stock Pick Game deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy env.production.template to .env and configure your environment variables:"
    echo "cp env.production.template .env"
    echo "nano .env"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running or not accessible!"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    exit 1
fi

print_status "Building and starting services..."

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_status "✅ Backend is healthy"
else
    print_warning "⚠️  Backend health check failed, but service might still be starting..."
fi

# Check frontend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Frontend is healthy"
else
    print_warning "⚠️  Frontend health check failed, but service might still be starting..."
fi

# Show running containers
print_status "Current container status:"
docker-compose ps

# Show logs
print_status "Recent logs:"
docker-compose logs --tail=20

print_status "🎉 Deployment completed!"
print_status "Your application should be available at:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost/api"
echo ""
print_status "To view logs: docker-compose logs -f"
print_status "To stop services: docker-compose down"
print_status "To restart services: docker-compose restart" 