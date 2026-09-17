#!/bin/sh
# Applies pending migrations (and loads the catalog the first time) before starting the server.
set -e

echo "→ Applying database migrations…"
node dist/migrate.cjs

if [ "${SEED_ON_START:-1}" = "1" ]; then
  echo "→ Checking the catalog…"
  # Idempotent: existing categories and products are left untouched.
  node dist/seed.cjs
fi

echo "→ Starting Tex Banner on port ${PORT:-3000}"
exec "$@"
