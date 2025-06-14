#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VPS_HOST="vps.tideye.com"
VPS_USER="root"

case "$1" in
  "deploy")
    git push origin master
    ;;
  "logs")
    ssh "$VPS_USER@$VPS_HOST" "cd /root/stock-pick-game && docker-compose logs -f"
    ;;
  "restart")
    ssh "$VPS_USER@$VPS_HOST" "cd /root/stock-pick-game && docker-compose restart"
    ;;
  "status")
    ssh "$VPS_USER@$VPS_HOST" "cd /root/stock-pick-game && docker-compose ps"
    ;;
  "migrate")
    ssh "$VPS_USER@$VPS_HOST" "cd /root/stock-pick-game && docker-compose exec stock_pick_backend npx prisma migrate deploy"
    ;;
  "update-nginx")
    ssh "$VPS_USER@$VPS_HOST" "docker exec nginx-proxy-manager_app_1 nginx -s reload"
    ;;
  "open")
    open https://stockpickgame.tideye.com
    ;;
  *)
    echo "Usage: ./scripts/prod.sh [deploy|logs|restart|status|migrate|update-nginx|open]"
    exit 1
    ;;
esac 