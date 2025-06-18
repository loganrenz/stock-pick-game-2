#!/bin/bash

# Set environment variables
export TURSO_DB_URL="libsql://prod1-loganrenz.aws-us-east-1.turso.io"
export TURSO_DB_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTAyMTcyOTgsImlkIjoiZGZiMDBlMmEtZTlhNi00YmNmLThmNzEtNGY5NmVhMjRjMDVlIiwicmlkIjoiNDhkOTQ0YWEtZjMxMS00YWE5LTlhNzMtZTUyODJiZjczOWEzIn0.5Q4Ug1njvAXZLscKVOge_qkqDnrh1tLQ6xV2h2DDZ9ZpmHDjef54u8eAWrxS3rdyLYn5iv98DJHAKwQDnCKVDA"

# Run migration
echo "Running database migration..."
npx tsx api-helpers/lib/migrate.ts

# Run seeding
echo "Running database seeding..."
npx tsx api-helpers/lib/seed.ts

echo "Database setup completed!" 