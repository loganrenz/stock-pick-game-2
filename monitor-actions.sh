#!/bin/bash

REPO="loganrenz/stock-pick-game"

while true; do
  clear
  echo "Latest GitHub Actions run for $REPO:"
  LATEST=$(gh run list --limit 1 --repo "$REPO" | head -n 1)
  echo "$LATEST"
  STATUS=$(echo "$LATEST" | awk '{print $7}')
  if [[ "$STATUS" == "success" ]]; then
    echo "Workflow succeeded."
    exit 0
  elif [[ "$STATUS" == "failure" || "$STATUS" == "cancelled" ]]; then
    echo "Workflow failed or was cancelled."
    exit 1
  fi
  sleep 10
done 