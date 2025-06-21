#!/bin/bash

# A script to build, run, and smoke test the local Docker environment.

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Configuration ---
COMPOSE_FILE="docker-compose.dev.yml"
BACKEND_HEALTH_URL="http://localhost:8081/health"
FRONTEND_URL="http://localhost:5173"
WAIT_TIME=15 # Seconds to wait for services to start

# Function to print a formatted message
print_message() {
  echo -e "\n${YELLOW}---------- $1 ----------${NC}\n"
}

# Function to handle script exit
cleanup() {
  print_message "Stopping and cleaning up Docker containers..."
  docker-compose -f "$COMPOSE_FILE" down
  echo -e "${GREEN}Cleanup complete.${NC}"
}

# Ensure cleanup runs on script exit or interruption
trap cleanup EXIT INT

# --- Test Execution ---
print_message "Building and starting Docker containers..."
docker-compose -f $COMPOSE_FILE up --build -d

if [ $? -ne 0 ]; then
  echo -e "${RED}Docker Compose build failed. Aborting.${NC}"
  exit 1
fi

print_message "Waiting ${WAIT_TIME} seconds for services to initialize..."
sleep $WAIT_TIME

# --- Smoke Tests ---
print_message "Starting smoke tests..."
TESTS_PASSED=true

# 1. Test Backend Health Endpoint
echo -e "${YELLOW}Test 1: Checking backend health at $BACKEND_HEALTH_URL...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_HEALTH_URL)

if [ "$BACKEND_STATUS" -eq 200 ]; then
  echo -e "${GREEN}Backend health check PASSED (HTTP 200).${NC}"
else
  echo -e "${RED}Backend health check FAILED. Expected HTTP 200, got ${BACKEND_STATUS}.${NC}"
  TESTS_PASSED=false
fi

# 2. Test Frontend Server Response
echo -e "\n${YELLOW}Test 2: Checking frontend server at $FRONTEND_URL...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)

# Vite dev server usually returns a 200 for the root.
if [ "$FRONTEND_STATUS" -eq 200 ]; then
  echo -e "${GREEN}Frontend server check PASSED (HTTP 200).${NC}"
else
  echo -e "${RED}Frontend server check FAILED. Expected HTTP 200, got ${FRONTEND_STATUS}.${NC}"
  TESTS_PASSED=false
fi

# --- Final Report ---
print_message "Smoke Test Results"
if [ "$TESTS_PASSED" = true ]; then
  echo -e "${GREEN}✅ All smoke tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some smoke tests failed. Please review the logs.${NC}"
  exit 1
fi 