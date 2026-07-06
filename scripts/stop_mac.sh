#!/usr/bin/env bash
# scripts/stop_mac.sh — Stop ResumeTailor (macOS/Linux)
set -euo pipefail

CONTAINER_NAME="resumetailor"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping ResumeTailor..."
  docker stop "${CONTAINER_NAME}"
  docker rm "${CONTAINER_NAME}"
  echo "Stopped. Your data is preserved in Docker volumes (resumedb-data, resumepdf-data)."
else
  echo "ResumeTailor is not running."
fi
