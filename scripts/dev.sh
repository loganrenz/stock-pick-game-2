#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

case "$1" in
  "up")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml up -d
    ;;
  "down")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down
    ;;
  "logs")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml logs -f
    ;;
  "migrate")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml exec stock_pick_backend npx prisma migrate dev
    ;;
  "seed")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml exec stock_pick_backend npx prisma db seed
    ;;
  "clean")
    cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    ;;
  "open")
    open http://localhost:5173
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [up|down|logs|migrate|seed|clean|open]"
    exit 1
    ;;
esac 