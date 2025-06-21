# VPS Deployment Checklist

## 🖥️ VPS Information

- **IP Address**: 45.79.207.109
- **OS**: Ubuntu 24.04.1 LTS
- **User**: (your VPS username)

## 📋 Pre-Deployment Steps

### 1. Local Setup (on your development machine)

- [ ] Push code to GitHub to trigger Docker image build
- [ ] Copy environment template: `cp env.production.template .env`
- [ ] Edit `.env` with your actual values:

  ```bash
  JWT_SECRET=your-super-secure-jwt-secret
  VITE_APPLE_CLIENT_ID=your.apple.client.id
  VITE_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
  VITE_APPLE_REDIRECT_URI_DEV=https://yourdomain.com/auth/apple/callback
  FRONTEND_URL=https://yourdomain.com
  GITHUB_REPOSITORY=your-username/stock-pick-game
  ```

### 2. Transfer Files to VPS

```bash
# From your local machine
scp setup-vps.sh docker-compose.prod.yml deploy-prod.sh env.production.template your-username@45.79.207.109:~/
```

## 🚀 VPS Deployment Steps

### 3. SSH into VPS and Setup

```bash
ssh your-username@45.79.207.109
```

### 4. Run VPS Setup Script

```bash
chmod +x setup-vps.sh
./setup-vps.sh
```

### 5. Logout and Login Again

```bash
exit
ssh your-username@45.79.207.109
```

### 6. Configure Environment

```bash
cd ~/stock-pick-game
cp env.production.template .env
nano .env  # Edit with your actual values
```

### 7. Deploy Application

```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

## 🔧 Post-Deployment Configuration

### 8. Configure Nginx Proxy Manager (NPM)

- [ ] Access your NPM dashboard
- [ ] Add new proxy host:
  - Domain: `yourdomain.com`
  - Scheme: `http`
  - Forward Hostname/IP: `localhost`
  - Forward Port: `6969`
  - Enable SSL

### 9. Configure Apple Sign In

- [ ] Go to Apple Developer Console
- [ ] Update your App ID with production domain
- [ ] Add return URL: `https://yourdomain.com/auth/apple/callback`

### 10. Test Application

- [ ] Visit `https://yourdomain.com`
- [ ] Test Apple Sign In flow
- [ ] Verify all functionality works

## 📊 Monitoring Commands

```bash
# Check application status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Backup database
docker-compose -f docker-compose.prod.yml exec app cp /app/data/stock-pick-game.db /app/data/stock-pick-game.db.backup
```

## 🔄 Update Process

To update to the latest version:

```bash
# On VPS
cd ~/stock-pick-game
./deploy-prod.sh
```

## 🆘 Troubleshooting

### Common Issues

1. **Container won't start**: Check logs with `docker-compose -f docker-compose.prod.yml logs app`
2. **Port conflicts**: Ensure port 6969 is not used by other services
3. **Apple Sign In issues**: Verify domain configuration in Apple Developer Console
4. **Database issues**: Check if data volume is properly mounted

### Useful Commands

```bash
# Restart application
docker-compose -f docker-compose.prod.yml restart

# Access container shell
docker-compose -f docker-compose.prod.yml exec app sh

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env
```
