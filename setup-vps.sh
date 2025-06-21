#!/bin/bash

# VPS Setup Script for Stock Pick Game
set -e

echo "🔧 Setting up VPS for Stock Pick Game deployment..."

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing required packages..."
sudo apt install -y curl wget git nano htop

print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

print_status "Creating application directory..."
mkdir -p ~/stock-pick-game
cd ~/stock-pick-game

print_status "Setting up firewall (optional)..."
# Allow SSH, HTTP, HTTPS, and the application port
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 6969
sudo ufw --force enable

print_status "Creating deployment directory structure..."
mkdir -p ~/stock-pick-game/{data,logs,backups}

print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/stock-pick-game > /dev/null <<EOF
/home/$USER/stock-pick-game/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

print_status "🔧 VPS setup completed!"
print_status ""
print_status "Next steps:"
echo "1. Logout and login again for Docker group changes to take effect"
echo "2. Transfer deployment files to ~/stock-pick-game/"
echo "3. Configure your .env file"
echo "4. Run the deployment script"
echo ""
print_status "To transfer files from your local machine:"
echo "scp docker-compose.prod.yml deploy-prod.sh env.production.template $USER@$(hostname -I | awk '{print $1}'):~/stock-pick-game/"
echo ""
print_status "After transferring files:"
echo "cd ~/stock-pick-game"
echo "cp env.production.template .env"
echo "nano .env  # Configure your environment variables"
echo "./deploy-prod.sh" 