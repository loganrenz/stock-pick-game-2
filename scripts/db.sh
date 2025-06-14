#!/bin/bash

# SQLite DB backup/restore helpers
DB_PATH="../backend/prisma/dev.db"
BACKUP_DIR="../backups"

backup() {
  mkdir -p "$BACKUP_DIR"
  cp "$DB_PATH" "$BACKUP_DIR/dev-$(date +%Y%m%d%H%M%S).db"
  echo "Backup complete: $BACKUP_DIR"
}

restore() {
  if [ -z "$1" ]; then
    echo "Usage: $0 restore <backup_file>"
    exit 1
  fi
  cp "$BACKUP_DIR/$1" "$DB_PATH"
  echo "Restored $1 to $DB_PATH"
}

case "$1" in
  backup)
    backup
    ;;
  restore)
    restore "$2"
    ;;
  *)
    echo "Usage: $0 {backup|restore <backup_file>}"
    exit 1
    ;;
esac

exit 0 