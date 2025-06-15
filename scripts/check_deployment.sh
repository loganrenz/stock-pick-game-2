#!/bin/bash

# Check if the container is running
echo "Checking container status..."
docker ps | grep stock-pick-game

# Check container logs
echo -e "\nChecking container logs..."
docker logs stock_pick_game

# Check if the ports are listening
echo -e "\nChecking if ports are listening..."
netstat -tulpn | grep -E '4556|5173'

# Check database file
echo -e "\nChecking database file..."
ls -l /root/stock-pick-game/data/dev.db

# Check environment variables
echo -e "\nChecking environment variables..."
docker exec stock_pick_game env | grep -E 'NODE_ENV|PORT|DATABASE_URL' 