# Stock Pick Game Deployment Guide

This guide will help you deploy the Stock Pick Game application to a VPS using Docker and GitHub Actions.

## Prerequisites

- A VPS with Docker and Docker Compose installed
- A GitHub repository for the project
- A domain name (for Apple Sign In configuration)
- Apple Developer account (for Sign in with Apple)

## Step 1: GitHub Actions Setup

The GitHub Actions workflow will automatically build and publish Docker images to GitHub Container Registry.

### 1.1 Enable GitHub Actions

1. Push your code to GitHub
2. Go to your repository → Actions tab
3. The workflow will automatically run on pushes to the `main` branch

### 1.2 Configure Repository Permissions

1. Go to your repository → Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Save the changes

### 1.3 Verify Image Publication

After a successful workflow run, you can verify the image was published:

- Go to your repository → Packages tab
- You should see your Docker image listed

## Step 2: VPS Setup

### 2.1 Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
```

### 2.2 Transfer Files to VPS

Transfer these files to your VPS:

- `docker-compose.prod.yml`
- `deploy-prod.sh`
- `env.production.template`

```bash
# On your local machine
scp docker-compose.prod.yml deploy-prod.sh env.production.template user@your-vps-ip:/path/to/app/
```

### 2.3 Configure Environment Variables

```bash
# On your VPS
cd /path/to/app
cp env.production.template .env
nano .env
```

Configure the following variables in `.env`:

```bash
# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production

# Apple Sign In Configuration
VITE_APPLE_CLIENT_ID=your.apple.client.id
VITE_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
VITE_APPLE_REDIRECT_URI_DEV=https://yourdomain.com/auth/apple/callback

# GitHub Repository (replace with your actual repository)
GITHUB_REPOSITORY=your-username/stock-pick-game
```

### 2.4 Deploy the Application

```bash
# Make the deployment script executable
chmod +x deploy-prod.sh

# Run the deployment
./deploy-prod.sh
```

## Step 3: Domain and DNS Configuration

### 3.1 Point Domain to VPS

1. Go to your domain registrar's DNS settings
2. Add an A record pointing to your VPS IP address:

   ```
   Type: A
   Name: @ (or your subdomain)
   Value: YOUR_VPS_IP_ADDRESS
   TTL: 300
   ```

### 3.2 Configure Nginx Proxy Manager (NPM)

1. Access your NPM dashboard
2. Add a new proxy host:
   - Domain: `yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `localhost`
   - Forward Port: `6969`
   - Enable SSL (recommended)

## Step 4: Apple Sign In Configuration

### 4.1 Update Apple Developer Configuration

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to Certificates, Identifiers & Profiles
3. Select your App ID
4. Under "Sign in with Apple", click "Configure"
5. Add your production domain:
   - Primary App ID: `your.apple.client.id`
   - Domains and Subdomains: `yourdomain.com`
   - Return URLs: `https://yourdomain.com/auth/apple/callback`

### 4.2 Update Environment Variables

Update your `.env` file with the production Apple configuration:

```bash
VITE_APPLE_CLIENT_ID=your.apple.client.id
VITE_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
VITE_APPLE_REDIRECT_URI_DEV=https://yourdomain.com/auth/apple/callback
```

### 4.3 Redeploy with New Configuration

```bash
# Restart the application with new environment variables
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Step 5: Testing and Verification

### 5.1 Test Basic Functionality

1. Visit your domain: `https://yourdomain.com`
2. Verify the application loads correctly
3. Test navigation between pages

### 5.2 Test Apple Sign In

1. Click "Sign in with Apple" button
2. Complete the Apple authentication flow
3. Verify you're redirected back to the application
4. Check that you're logged in successfully

### 5.3 Monitor Logs

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Step 6: Maintenance and Updates

### 6.1 Update Application

To update to the latest version:

```bash
# Pull and restart with latest image
./deploy-prod.sh
```

### 6.2 Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec app cp /app/data/stock-pick-game.db /app/data/stock-pick-game.db.backup

# Copy backup to host
docker cp stock-pick-game:/app/data/stock-pick-game.db.backup ./backup-$(date +%Y%m%d-%H%M%S).db
```

### 6.3 Monitor Resources

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Check disk usage
df -h
```

## Troubleshooting

### Common Issues

1. **Container won't start**: Check logs with `docker-compose -f docker-compose.prod.yml logs app`
2. **Apple Sign In not working**: Verify domain configuration in Apple Developer Console
3. **Database issues**: Check if the data volume is properly mounted
4. **Port conflicts**: Ensure port 6969 is not used by other services

### Useful Commands

```bash
# Restart application
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Access container shell
docker-compose -f docker-compose.prod.yml exec app sh

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env
```

## Security Considerations

1. **JWT Secret**: Use a strong, random JWT secret
2. **Environment Variables**: Never commit `.env` files to version control
3. **SSL**: Always use HTTPS in production
4. **Firewall**: Configure firewall to only allow necessary ports
5. **Updates**: Regularly update Docker images and system packages

## Support

If you encounter issues:

1. Check the application logs
2. Verify environment variable configuration
3. Ensure all prerequisites are met
4. Check Apple Developer Console configuration
