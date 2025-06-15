#!/bin/bash

echo "Checking deployment status on VPS (using SSH alias 'vps')..."

ssh vps << 'EOF'
    echo "=== Docker Container Status ==="
    docker ps

    echo -e "\n=== Docker Container Logs ==="
    echo "Backend logs:"
    docker logs stock-pick-game_stock_pick_backend_1 --tail 50
    echo -e "\nFrontend logs:"
    docker logs stock-pick-game_stock_pick_frontend_1 --tail 50

    echo -e "\n=== Nginx Configuration ==="
    cat /etc/nginx/sites-enabled/stockpickgame.tideye.com

    echo -e "\n=== Nginx Status ==="
    systemctl status nginx

    echo -e "\n=== Network Connectivity ==="
    echo "Checking backend port (4556):"
    curl -I http://localhost:4556
    echo -e "\nChecking frontend port (5173):"
    curl -I http://localhost:5173
EOF 