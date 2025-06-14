#!/bin/bash

REPO="loganrenz/stock-pick-game"

while true; do
  clear
  echo "Monitoring latest GitHub Actions run for $REPO:"
  LATEST=$(gh run list --limit 1 --repo "$REPO" | head -n 1)
  echo "$LATEST"
  RUN_ID=$(echo "$LATEST" | awk '{print $7}')
  STATUS=$(echo "$LATEST" | awk '{print $3}')
  TIME=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIME] Run ID: $RUN_ID | Status: $STATUS"
  if [[ "$STATUS" == "success" ]]; then
    echo "Workflow succeeded."
    exit 0
  elif [[ "$STATUS" == "failure" || "$STATUS" == "cancelled" ]]; then
    echo "Workflow failed or was cancelled. Showing logs:"
    gh run view "$RUN_ID" --repo "$REPO" --log
    exit 1
  fi
  sleep 10
done 