#!/bin/bash

# This script runs database migrations against the production database.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running production database migrations..."

# Set production database credentials
export TURSO_DB_URL="libsql://prod1-loganrenz.aws-us-east-1.turso.io"
export TURSO_DB_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTAyMTcyOTgsImlkIjoiZGZiMDBlMmEtZTlhNi00YmNmLThmNzEtNGY5NmVhMjRjMDVlIiwicmlkIjoiNDhkOTQ0YWEtZjMxMS00YWE5LTlhNzMtZTUyODJiZjczOWEzIn0.5Q4Ug1njvAXZLscKVOge_qkqDnrh1tLQ6xV2h2DDZ9ZpmHDjef54u8eAWrxS3rdyLYn5iv98DJHAKwQDnCKVDA"

# Run the migration
npm run db:migrate

echo "Production migrations completed successfully." 