#!/bin/bash

# investigate_deployment.sh
# Investigation script for Stock Pick Game deployment issues
# This version SSHs into the VPS (using the 'vps' alias) for all checks
# Extend this script as needed for future investigations

INVESTIGATION_SUMMARY="investigation_summary.txt"
echo "Stock Pick Game Deployment Investigation - $(date)" > $INVESTIGATION_SUMMARY

VPS="vps"

# 1. Docker Containers Status
echo "\n1. Docker Containers Status" | tee -a $INVESTIGATION_SUMMARY
ssh $VPS "docker ps" | tee -a $INVESTIGATION_SUMMARY

# 2. Frontend Container Listening on Port 5173
echo "\n2. Frontend Container Listening on Port 5173" | tee -a $INVESTIGATION_SUMMARY
FRONTEND_ID=$(ssh $VPS "docker ps --filter 'name=stock-pick-game-frontend' --format '{{.ID}}'")
if [ -n "$FRONTEND_ID" ]; then
  ssh $VPS "docker exec $FRONTEND_ID lsof -i :5173 2>/dev/null" | tee -a $INVESTIGATION_SUMMARY
else
  echo "Frontend container not running" | tee -a $INVESTIGATION_SUMMARY
fi

# 3. Backend Container Listening on Port 4556
echo "\n3. Backend Container Listening on Port 4556" | tee -a $INVESTIGATION_SUMMARY
BACKEND_ID=$(ssh $VPS "docker ps --filter 'name=stock-pick-game-backend' --format '{{.ID}}'")
if [ -n "$BACKEND_ID" ]; then
  ssh $VPS "docker exec $BACKEND_ID lsof -i :4556 2>/dev/null" | tee -a $INVESTIGATION_SUMMARY
else
  echo "Backend container not running" | tee -a $INVESTIGATION_SUMMARY
fi

# 4. Last 50 lines of Frontend Logs
echo "\n4. Last 50 lines of Frontend Logs" | tee -a $INVESTIGATION_SUMMARY
if [ -n "$FRONTEND_ID" ]; then
  ssh $VPS "docker logs --tail 50 $FRONTEND_ID" | tee -a $INVESTIGATION_SUMMARY
else
  echo "No frontend logs available" | tee -a $INVESTIGATION_SUMMARY
fi

# 5. Last 50 lines of Backend Logs
echo "\n5. Last 50 lines of Backend Logs" | tee -a $INVESTIGATION_SUMMARY
if [ -n "$BACKEND_ID" ]; then
  ssh $VPS "docker logs --tail 50 $BACKEND_ID" | tee -a $INVESTIGATION_SUMMARY
else
  echo "No backend logs available" | tee -a $INVESTIGATION_SUMMARY
fi

# 6. Container Health Status
echo "\n6. Container Health Status" | tee -a $INVESTIGATION_SUMMARY
ssh $VPS "docker ps --format 'table {{.Names}}\t{{.Status}}'" | tee -a $INVESTIGATION_SUMMARY

# 7. Nginx Proxy Manager Status (if present)
echo "\n7. Nginx Proxy Manager Status (if present)" | tee -a $INVESTIGATION_SUMMARY
NPM_ID=$(ssh $VPS "docker ps --filter 'name=nginx-proxy-manager' --format '{{.ID}}'")
if [ -n "$NPM_ID" ]; then
  ssh $VPS "docker ps --filter 'id=$NPM_ID'" | tee -a $INVESTIGATION_SUMMARY
else
  echo "Nginx Proxy Manager container not found (may not be managed by docker or has a different name)" | tee -a $INVESTIGATION_SUMMARY
fi

# 8. Summarize findings
echo "\n8. Investigation Complete. Review $INVESTIGATION_SUMMARY for details." | tee -a $INVESTIGATION_SUMMARY 