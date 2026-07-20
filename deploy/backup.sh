#!/usr/bin/env bash
#
# Horom-ийн өдөр тутмын backup: Postgres (логик dump) + MinIO зураг (volume
# архив). Cron-оор өдөрт нэг удаа ажиллуулна (доор DEPLOY.md-ийн зааврыг үз).
#
# Хадгалалт: /opt/baby-timelapse/backups/  (RETENTION_DAYS хоног)
# Лог:       /opt/baby-timelapse/backups/backup.log
#
# Offsite (Backblaze B2 / S3) руу хийхийг ХҮЧТЭЙ зөвлөнө — доор OFFSITE
# хэсгийг тайлбар болгож үлдээв (rclone тохируулаад идэвхжүүлнэ).

set -euo pipefail

APP_DIR="/opt/baby-timelapse"
COMPOSE="$APP_DIR/docker-compose.prod.yml"
BACKUP_DIR="$APP_DIR/backups"
RETENTION_DAYS=14
DATE="$(date +%F_%H%M)"

mkdir -p "$BACKUP_DIR"

# Бүх гаралтыг лог руу давхарлана (cron-д stdout харагдахгүй тул).
exec >> "$BACKUP_DIR/backup.log" 2>&1
echo "===== backup эхэллээ: $(date -Iseconds) ====="

# Аль нэг алхам унавал лог-д тодоор тэмдэглэнэ (cron дуугүй бүтэлгүйтэхгүй).
trap 'echo "!!! BACKUP БҮТЭЛГҮЙТЛЭЭ ($(date -Iseconds)) — дээрх алдааг үз"' ERR

# ── 1. Postgres (логик dump, gzip) ──────────────────────────────
DB_FILE="$BACKUP_DIR/db-$DATE.sql.gz"
docker compose -f "$COMPOSE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$DB_FILE"
echo "  ✓ DB: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# ── 2. MinIO зураг (volume-ийн raw архив) ───────────────────────
# Volume-ийн нэрийг container-аас олно (project нэр өөрчлөгдсөн ч ажиллана).
MINIO_VOL="$(docker inspect baby-timelapse-storage \
  -f '{{ range .Mounts }}{{ if eq .Destination "/data" }}{{ .Name }}{{ end }}{{ end }}')"
if [ -z "$MINIO_VOL" ]; then
  echo "!!! MinIO volume олдсонгүй — зураг backup алгаслаа"
else
  PHOTO_FILE="$BACKUP_DIR/minio-$DATE.tar.gz"
  docker run --rm \
    -v "$MINIO_VOL":/data:ro \
    -v "$BACKUP_DIR":/backup \
    alpine sh -c "tar czf /backup/minio-$DATE.tar.gz -C /data ."
  echo "  ✓ Зураг: $PHOTO_FILE ($(du -h "$PHOTO_FILE" | cut -f1))"
fi

# ── 3. Хуучин backup-уудыг цэвэрлэх ─────────────────────────────
find "$BACKUP_DIR" -name 'db-*.sql.gz'   -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name 'minio-*.tar.gz' -mtime +$RETENTION_DAYS -delete
echo "  ✓ $RETENTION_DAYS хоногоос хуучин backup цэвэрлэгдлээ"

# ── 4. OFFSITE (сонголт — rclone тохируулсны дараа идэвхжүүлнэ) ──
# rclone-г тохируулаад (rclone config → remote нэр 'offsite') доорхыг нээнэ:
# rclone copy "$BACKUP_DIR" offsite:horom-backups --include 'db-*.sql.gz' \
#   --include 'minio-*.tar.gz' --max-age ${RETENTION_DAYS}d && echo "  ✓ Offsite mirror"

echo "===== backup дууслаа: $(date -Iseconds) ====="
echo ""
