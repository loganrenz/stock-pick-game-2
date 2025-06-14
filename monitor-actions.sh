#!/bin/bash

REPO="loganrenz/stock-pick-game"

while true; do
  clear
  echo "Monitoring latest GitHub Actions run for $REPO:"
  JSON=$(gh run list --limit 1 --repo "$REPO" --json databaseId,status,conclusion,name,headBranch,event)
  RUN_ID=$(echo "$JSON" | grep -o '"databaseId":[0-9]*' | head -1 | grep -o '[0-9]*')
  STATUS=$(echo "$JSON" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
  CONCLUSION=$(echo "$JSON" | grep -o '"conclusion":"[^"]*' | head -1 | cut -d'"' -f4)
  NAME=$(echo "$JSON" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
  TIME=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIME] Workflow: $NAME | Status: $STATUS | Conclusion: $CONCLUSION | Run ID: $RUN_ID"
  if [[ "$CONCLUSION" == "success" ]]; then
    echo "Workflow succeeded. Showing logs:"
    gh run view "$RUN_ID" --repo "$REPO" --log
    exit 0
  elif [[ "$CONCLUSION" == "failure" || "$CONCLUSION" == "cancelled" ]]; then
    echo "Workflow failed or was cancelled. Showing logs:"
    gh run view "$RUN_ID" --repo "$REPO" --log
    exit 1
  fi
  sleep 10
done 