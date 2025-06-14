#!/bin/bash

# Copy docker-compose to VPS
scp docker-compose.yml root@vps.tideye.com:/root/stock-pick-game/

# SSH into VPS and restart services
ssh root@vps.tideye.com << EOF
cd /root/stock-pick-game
docker login ghcr.io -u loganrenz -p $GH_PAT
docker-compose down
docker-compose up -d
docker-compose logs -f
EOF