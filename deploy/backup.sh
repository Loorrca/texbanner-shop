#!/bin/sh
# Daily backup: database dump + customer files (logos) + catalog photos.
# Example cron (crontab -e):  30 2 * * *  /home/pi/texbanner-shop/deploy/backup.sh
set -e
cd "$(dirname "$0")"
DEST="${BACKUP_DIR:-$HOME/texbanner-backups}"
DAY=$(date +%F)
mkdir -p "$DEST"

docker compose -f docker-compose.pi.yml exec -T db pg_dump -U texbanner texbanner | gzip > "$DEST/db-$DAY.sql.gz"
docker run --rm -v texbanner_storage:/storage:ro -v "$DEST":/backup alpine \
  tar czf "/backup/storage-$DAY.tar.gz" -C /storage .

# Keep the last 14 days
find "$DEST" -name '*.gz' -mtime +14 -delete
echo "Backup written to $DEST"
