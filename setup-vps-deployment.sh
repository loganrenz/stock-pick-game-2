#!/bin/bash

# VPS Deployment Setup Script for Stock Pick Game
# Run this script on your VPS to set up the deployment environment

set -e

echo "🚀 Setting up Stock Pick Game deployment on VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (or with sudo)"
    exit 1
fi

print_step "1. Installing Docker and Docker Compose"

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose is already installed"
fi

print_step "2. Creating application directory"

# Create app directory
APP_DIR="/root/stock-pick-game-2"
mkdir -p $APP_DIR
cd $APP_DIR

print_status "Created directory: $APP_DIR"

print_step "3. Setting up deployment files"

# Create docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Stock Pick Game Application
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:latest
    container_name: stock-pick-game
    restart: unless-stopped
    ports:
      - "6969:6969"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=6969
      - DATABASE_URL=file:/app/data/stock-pick-game.db
      - JWT_SECRET=${JWT_SECRET}
      - VITE_APPLE_CLIENT_ID=${VITE_APPLE_CLIENT_ID}
      - VITE_APPLE_REDIRECT_URI=${VITE_APPLE_REDIRECT_URI}
      - VITE_APPLE_REDIRECT_URI_DEV=${VITE_APPLE_REDIRECT_URI_DEV}
      - APPLE_CLIENT_ID=${APPLE_CLIENT_ID}
      - APPLE_REDIRECT_URI=${APPLE_REDIRECT_URI}
      - APPLE_REDIRECT_URI_DEV=${APPLE_REDIRECT_URI_DEV}
      - APPLE_TEAM_ID=${APPLE_TEAM_ID}
      - APPLE_KEY_ID=${APPLE_KEY_ID}
      - APPLE_PRIVATE_KEY=${APPLE_PRIVATE_KEY}
      - FRONTEND_URL=${FRONTEND_URL}
    volumes:
      - stock-pick-game-data:/app/data
      - stock-pick-game-logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:6969/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

volumes:
  stock-pick-game-data:
    driver: local
  stock-pick-game-logs:
    driver: local

networks:
  app-network:
    driver: bridge
EOF

# Create environment template
cat > .env.template << 'EOF'
# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production

# Apple Sign In Configuration
VITE_APPLE_CLIENT_ID=your.apple.client.id
VITE_APPLE_REDIRECT_URI=https://stockpickgame.tideye.com/auth/apple/callback
VITE_APPLE_REDIRECT_URI_DEV=https://stockpickgame.tideye.com/auth/apple/callback
APPLE_CLIENT_ID=your.apple.client.id
APPLE_REDIRECT_URI=https://stockpickgame.tideye.com/auth/apple/callback
APPLE_REDIRECT_URI_DEV=https://stockpickgame.tideye.com/auth/apple/callback
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Application Configuration
FRONTEND_URL=https://stockpickgame.tideye.com
GITHUB_REPOSITORY=your-username/stock-pick-game
EOF

print_status "Created deployment configuration files"

print_step "4. Setting up environment variables"

if [ ! -f .env ]; then
    cp .env.template .env
    print_warning "Created .env file from template. You MUST edit it with your actual values!"
    print_warning "Run: nano .env"
else
    print_status ".env file already exists"
fi

print_step "5. Setting up firewall (if ufw is available)"

if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 6969/tcp  # Application port
    print_status "Firewall rules configured"
else
    print_warning "ufw not found, skipping firewall configuration"
fi

print_step "6. Final setup"

# Make sure Docker daemon is running
systemctl enable docker
systemctl start docker

print_status "Docker daemon enabled and started"

echo ""
print_status "🎉 VPS setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Edit the environment variables: nano $APP_DIR/.env"
echo "2. Set up your GitHub repository secrets (VPS_SSH_KEY)"
echo "3. Push code to main branch to trigger deployment"
echo ""
print_status "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Restart app: docker-compose -f docker-compose.prod.yml restart"
echo "  - Stop app: docker-compose -f docker-compose.prod.yml down"
echo "  - Update app: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
echo ""
print_status "Your app will be available at: https://stockpickgame.tideye.com"
print_warning "Don't forget to configure your reverse proxy (Nginx/Cloudflare) to point to port 6969!" 