#!/bin/bash

# Script to clone production database to development database
# This script dumps the prod DB and restores it to the dev DB

set -e  # Exit on any error

echo "Starting production to development database clone..."

# Production database details
PROD_DB_URL="libsql://prod1-loganrenz.aws-us-east-1.turso.io"
PROD_DB_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTAyMTcyOTgsImlkIjoiZGZiMDBlMmEtZTlhNi00YmNmLThmNzEtNGY5NmVhMjRjMDVlIiwicmlkIjoiNDhkOTQ0YWEtZjMxMS00YWE5LTlhNzMtZTUyODJiZjczOWEzIn0.5Q4Ug1njvAXZLscKVOge_qkqDnrh1tLQ6xV2h2DDZ9ZpmHDjef54u8eAWrxS3rdyLYn5iv98DJHAKwQDnCKVDA"

# Development database details
DEV_DB_URL="libsql://dev1-loganrenz.aws-us-east-1.turso.io"
DEV_DB_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTAyMDU2NjEsImlkIjoiNGVhOTVhNGItNDYyMi00MGJiLWE2NWYtOGE3YmYxY2JlOTM5IiwicmlkIjoiZjQ5NWY1YTMtYjU2Mi00NTYxLWIxNGItYmQyNGEyNjI1YjIxIn0.gPol3fSRqB2Svq02khk4AYl5BMcmodE4e0zpxba9EPyFwixf1_F7n4ozXgPUW6H_m6S0bH3aSPiXLhp7B1okAg"

# Temporary file for the dump
DUMP_FILE="temp_prod_dump.sql"

echo "Step 1: Creating dump of production database..."

# Create dump using Turso CLI
# Note: This requires the Turso CLI to be installed and authenticated
turso db shell prod1 .dump > "$DUMP_FILE"

if [ ! -f "$DUMP_FILE" ] || [ ! -s "$DUMP_FILE" ]; then
    echo "Error: Failed to create dump file or dump file is empty"
    exit 1
fi

echo "Step 2: Dump created successfully. Size: $(wc -l < "$DUMP_FILE") lines"

echo "Step 3: Restoring dump to development database..."

# Restore to dev database using Turso CLI
turso db shell dev1 < "$DUMP_FILE"

echo "Step 4: Cleaning up temporary files..."

# Clean up the dump file
rm -f "$DUMP_FILE"

echo "Production to development database clone completed successfully!"
echo ""
echo "Note: The development database now contains a copy of the production data."
echo "You can now run the development server with: npm run dev" 