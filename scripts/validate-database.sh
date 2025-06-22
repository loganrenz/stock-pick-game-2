#!/bin/bash

# STONX Database Validation Script
# Validates database integrity and structure

# Default database path - can be overridden with command line argument
DB_PATH="${1:-/root/stonx/data/stonx.db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "Validating STONX database: $DB_PATH"

set -e

# Configuration
DB_PATH="${1:-/root/stonx/data/stonx.db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[VALIDATE]${NC} $1"
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

VALIDATION_FAILED=0

fail_validation() {
    print_error "$1"
    VALIDATION_FAILED=1
}

print_status "Validating database: $DB_PATH"

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    fail_validation "Database file not found: $DB_PATH"
    exit 1
fi

# Check database integrity
print_info "Checking database integrity..."
INTEGRITY_CHECK=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>/dev/null || echo "failed")
if [ "$INTEGRITY_CHECK" = "ok" ]; then
    print_status "✅ Database integrity OK"
else
    fail_validation "❌ Database integrity check failed: $INTEGRITY_CHECK"
fi

# Check required tables exist
print_info "Checking required tables..."
REQUIRED_TABLES=("users" "weeks" "picks" "stock_prices" "__drizzle_migrations")

for table in "${REQUIRED_TABLES[@]}"; do
    if sqlite3 "$DB_PATH" ".tables" | grep -q "$table"; then
        print_status "✅ Table '$table' exists"
    else
        fail_validation "❌ Required table '$table' missing"
    fi
done

# Check table schemas
print_info "Validating table schemas..."

# Validate users table
USERS_SCHEMA=$(sqlite3 "$DB_PATH" ".schema users" 2>/dev/null || echo "")
if echo "$USERS_SCHEMA" | grep -iq "username.*text" && echo "$USERS_SCHEMA" | grep -iq "appleId.*text"; then
    print_status "✅ Users table schema valid"
else
    fail_validation "❌ Users table schema invalid"
fi

# Validate weeks table
WEEKS_SCHEMA=$(sqlite3 "$DB_PATH" ".schema weeks" 2>/dev/null || echo "")
if echo "$WEEKS_SCHEMA" | grep -iq "weekNum.*INTEGER" && echo "$WEEKS_SCHEMA" | grep -iq "startDate.*TEXT"; then
    print_status "✅ Weeks table schema valid"
else
    fail_validation "❌ Weeks table schema invalid"
fi

# Check data integrity
print_info "Checking data integrity..."

# Check for basic data
USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
WEEK_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM weeks;" 2>/dev/null || echo "0")
PICK_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM picks;" 2>/dev/null || echo "0")

print_info "Data counts:"
print_info "  Users: $USER_COUNT"
print_info "  Weeks: $WEEK_COUNT" 
print_info "  Picks: $PICK_COUNT"

if [ "$USER_COUNT" -eq 0 ]; then
    print_warning "⚠️  No users found in database"
fi

if [ "$WEEK_COUNT" -eq 0 ]; then
    print_warning "⚠️  No weeks found in database"
fi

# Check for orphaned picks (picks without valid user/week)
ORPHANED_PICKS=$(sqlite3 "$DB_PATH" "
SELECT COUNT(*) FROM picks p 
LEFT JOIN users u ON p.userId = u.id 
LEFT JOIN weeks w ON p.weekId = w.id 
WHERE u.id IS NULL OR w.id IS NULL;
" 2>/dev/null || echo "0")

if [ "$ORPHANED_PICKS" -eq 0 ]; then
    print_status "✅ No orphaned picks found"
else
    print_warning "⚠️  Found $ORPHANED_PICKS orphaned picks"
fi

# Check database size
DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || echo "0")
print_info "Database size: $(numfmt --to=iec "$DB_SIZE")"

if [ "$DB_SIZE" -lt 1024 ]; then
    print_warning "⚠️  Database size unusually small"
fi

# Final validation result
if [ $VALIDATION_FAILED -eq 0 ]; then
    print_status "🎉 Database validation passed!"
    exit 0
else
    print_error "💥 Database validation failed!"
    exit 1
fi 