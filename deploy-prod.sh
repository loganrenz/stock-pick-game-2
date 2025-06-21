#!/bin/bash

# Stock Pick Game Production Deployment Script (GitHub Container Registry)
set -e

echo "🚀 Starting Stock Pick Game production deployment..."

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

# Load environment variables
source .env

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

# Get GitHub repository from environment or prompt user
if [ -z "$GITHUB_REPOSITORY" ]; then
    print_warning "GITHUB_REPOSITORY environment variable not set."
    echo "Please enter your GitHub repository in format 'username/repo-name':"
    read -r GITHUB_REPOSITORY
    export GITHUB_REPOSITORY
fi

print_status "Using repository: $GITHUB_REPOSITORY"
print_status "VPS Host: ${VPS_HOST:-45.79.207.109}"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Pull latest image
print_status "Pulling latest image from GitHub Container Registry..."
docker-compose -f docker-compose.prod.yml pull

# Start services
print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:6969/health > /dev/null 2>&1; then
    print_status "✅ Application is healthy"
else
    print_warning "⚠️  Health check failed, but service might still be starting..."
fi

# Show running containers
print_status "Current container status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
print_status "Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

print_status "🎉 Production deployment completed!"
print_status "Your application should be available at:"
echo "  - Application: http://localhost:6969"
echo "  - VPS IP: http://${VPS_HOST:-45.79.207.109}:6969"
echo ""
print_status "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "To stop services: docker-compose -f docker-compose.prod.yml down"
print_status "To restart services: docker-compose -f docker-compose.prod.yml restart"
print_status "To update to latest version: ./deploy-prod.sh" 