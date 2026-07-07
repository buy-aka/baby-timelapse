#!/usr/bin/env bash
# Let's Encrypt SSL анхных удаагийн авах скрипт
# Хэрэглээ:  bash deploy/init-ssl.sh your-domain.com you@email.com
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Хэрэглээ: $0 <domain> <email>"
  exit 1
fi

DOMAIN=$1
EMAIL=$2
COMPOSE="docker compose -f docker-compose.prod.yml"

if grep -q "__DOMAIN__" deploy/nginx/conf.d/app.conf; then
  echo "ERROR: deploy/nginx/conf.d/app.conf still contains __DOMAIN__."
  echo "Replace __DOMAIN__ with $DOMAIN before running this script."
  exit 1
fi

echo "=== 1. ACME challenge folder ==="
mkdir -p deploy/certbot/conf deploy/certbot/www

# Анхдагч self-signed cert үүсгэх (Nginx эхлэхийн тулд)
echo "=== 2. Self-signed cert (temp) ==="
mkdir -p deploy/certbot/conf/live/"$DOMAIN"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout deploy/certbot/conf/live/"$DOMAIN"/privkey.pem \
  -out deploy/certbot/conf/live/"$DOMAIN"/fullchain.pem \
  -subj "/CN=$DOMAIN"

echo "=== 3. Nginx-ийг асаах ==="
$COMPOSE up -d nginx

echo "=== 4. Self-signed-ийг устгаж жинхэнэ certificate-ыг авах ==="
rm -rf deploy/certbot/conf/live/"$DOMAIN"

$COMPOSE run --rm --entrypoint "certbot" certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "=== 5. Nginx-ийг reload ==="
$COMPOSE exec nginx nginx -s reload

echo ""
echo "✅ SSL амжилттай олгогдсон. https://$DOMAIN-ыг шалгана уу"
