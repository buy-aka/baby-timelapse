#!/usr/bin/env bash
# Ubuntu 22.04 / 24.04-д шинэ серверийг бэлдэх скрипт
# Хэрэглээ:  sudo bash deploy/setup-server.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Энэ скриптийг root эсвэл sudo-р ажиллуулна уу"
  exit 1
fi

echo "=== 1. Систем шинэчлэх ==="
apt update && apt upgrade -y

echo "=== 2. Хэрэгтэй package-ууд ==="
apt install -y curl ca-certificates gnupg ufw git fail2ban

echo "=== 3. Docker суулгах ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

UBUNTU_CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $UBUNTU_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "=== 4. Firewall (UFW) ==="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== 5. fail2ban ==="
systemctl enable fail2ban
systemctl start fail2ban

echo "=== 6. Swap (1GB) — жижиг VM-д хэрэгтэй ==="
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo ""
echo "✅ Сервер бэлэн боллоо."
echo ""
echo "Дараагийн алхамууд:"
echo "  1. cd /opt && git clone <repo-url> baby-timelapse"
echo "  2. cd baby-timelapse"
echo "  3. cp .env.production.example .env && nano .env  (secret + URL-уудаа бөглөнө)"
echo ""
echo "  --- Домэйнтэй (HTTPS) ---"
echo "  4a. sed -i 's/__DOMAIN__/your-domain.com/g' deploy/nginx/conf.d/app.conf"
echo "  5a. bash deploy/init-ssl.sh your-domain.com you@email.com"
echo ""
echo "  --- Домэйнгүй (зөвхөн IP + HTTP, эхний ээлж) ---"
echo "  4b. cp deploy/nginx/app-http.conf deploy/nginx/conf.d/app.conf"
echo "      ( .env-д BETTER_AUTH_URL ба NEXT_PUBLIC_APP_URL = http://<server-ip> )"
echo ""
echo "  6. docker compose -f docker-compose.prod.yml up -d --build"
echo "  7. docker compose -f docker-compose.prod.yml exec app node lib/db/migrate.mjs"
echo ""
echo "  Дэлгэрэнгүй: deploy/DEPLOY.md"
