#!/bin/sh
# Pulls the newest image built by GitHub Actions and restarts the shop.
set -e
cd "$(dirname "$0")"
docker compose -f docker-compose.pi.yml pull
docker compose -f docker-compose.pi.yml up -d
docker image prune -f
docker compose -f docker-compose.pi.yml ps
