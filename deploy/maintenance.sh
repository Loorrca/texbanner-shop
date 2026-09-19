#!/bin/sh
# Maintenance mode — public visitors only.
#
#   ./maintenance.sh on      visitors on texbanner.com see the "boutique en maintenance" page
#   ./maintenance.sh off     shop back to normal
#   ./maintenance.sh         shows the current state
#
# While it is on, nothing else changes: the shop still works on the local network
# (http://<pi-address>:3000), /admin still works, order pages stay open and Konnect
# still confirms payments. The site stays online, so there is no DNS or tunnel change.
set -e
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.pi.yml"

state() {
  if grep -qiE '^MAINTENANCE="?(1|true|on)"?' .env 2>/dev/null; then echo on; else echo off; fi
}

case "${1:-status}" in
  status) echo "Maintenance : $(state)"; exit 0 ;;
  on) want=1 ;;
  off) want=0 ;;
  *) echo "Usage: $0 on|off" >&2; exit 1 ;;
esac

if [ ! -f .env ]; then
  echo "No .env file in $(pwd)" >&2
  exit 1
fi

if grep -qE '^MAINTENANCE=' .env; then
  sed -i "s|^MAINTENANCE=.*|MAINTENANCE=\"$want\"|" .env
else
  printf '\n# 1 = public visitors see the maintenance page (./maintenance.sh on|off)\nMAINTENANCE="%s"\n' "$want" >> .env
fi

$COMPOSE up -d --force-recreate app

printf 'Restarting'
i=0
while :; do
  if curl -fsS --max-time 2 http://localhost:3000/api/health >/dev/null 2>&1; then
    printf ' ok\n'
    break
  fi
  i=$((i + 1))
  if [ $i -ge 20 ]; then
    printf '\nStill not answering. Check: %s logs --tail 50 app\n' "$COMPOSE"
    break
  fi
  printf '.'
  sleep 2
done

echo "Maintenance : $(state)"
