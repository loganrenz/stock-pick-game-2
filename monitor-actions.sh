#!/bin/bash

REPO="loganrenz/stock-pick-game"

while true; do
  clear
  echo "Monitoring latest GitHub Actions run for $REPO:"
  LATEST=$(gh run list --limit 1 --repo "$REPO" | head -n 1)
  echo "$LATEST"
  NAME=$(echo "$LATEST" | awk '{print $2}')
  STATUS=$(echo "$LATEST" | awk '{print $4}')
  TIME=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIME] Workflow: $NAME | Status: $STATUS"
  if [[ "$STATUS" == "success" ]]; then
    echo "Workflow succeeded."
    exit 0
  elif [[ "$STATUS" == "failure" || "$STATUS" == "cancelled" ]]; then
    echo "Workflow failed or was cancelled."
    exit 1
  fi
  sleep 10
done 