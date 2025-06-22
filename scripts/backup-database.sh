#!/bin/bash

# Stock Pick Game Database Backup Script
# Industry standard backup with validation and retention

set -e

# Configuration
BACKUP_DIR="/root/database-backups"
APP_DATA_DIR="/root/stock-pick-game-2/data"
DB_FILE="stock-pick-game.db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

print_status "Starting database backup - $TIMESTAMP"

# Check if source database exists
if [ ! -f "$APP_DATA_DIR/$DB_FILE" ]; then
    print_error "Database file not found: $APP_DATA_DIR/$DB_FILE"
    exit 1
fi

# Get database info before backup
DB_SIZE=$(stat -c%s "$APP_DATA_DIR/$DB_FILE")
print_info "Database size: $(numfmt --to=iec $DB_SIZE)"

# Create backup with integrity check
print_status "Creating backup..."
cp "$APP_DATA_DIR/$DB_FILE" "$BACKUP_DIR/$TIMESTAMP/$DB_FILE"

# Verify backup integrity
print_status "Verifying backup integrity..."
if sqlite3 "$BACKUP_DIR/$TIMESTAMP/$DB_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    print_status "✅ Backup integrity verified"
else
    print_error "❌ Backup integrity check failed"
    rm -f "$BACKUP_DIR/$TIMESTAMP/$DB_FILE"
    exit 1
fi

# Get table counts for verification
print_status "Backup statistics:"
sqlite3 "$BACKUP_DIR/$TIMESTAMP/$DB_FILE" "
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Weeks: ' || COUNT(*) FROM weeks;
SELECT 'Picks: ' || COUNT(*) FROM picks;
SELECT 'Stock Prices: ' || COUNT(*) FROM stock_prices;
"

# Create metadata file
cat > "$BACKUP_DIR/$TIMESTAMP/backup-info.txt" << EOF
Backup Created: $TIMESTAMP
Source: $APP_DATA_DIR/$DB_FILE
Size: $(numfmt --to=iec $DB_SIZE)
Host: $(hostname)
User: $(whoami)
Git Commit: $(cd /root/stock-pick-game-2 && git rev-parse HEAD 2>/dev/null || echo "Unknown")
EOF

print_status "Backup completed: $BACKUP_DIR/$TIMESTAMP"

# Cleanup old backups (retention policy)
print_status "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

# List recent backups
print_info "Recent backups:"
ls -lt "$BACKUP_DIR" | head -6

print_status "🎉 Database backup completed successfully!" 