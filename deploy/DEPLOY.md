# Production deployment

Энэ заавар нь Ubuntu 22.04/24.04 VM-д **Fibocloud** эсвэл өөр VPS дээр Baby Timelapse-ыг docker-оор байршуулах.

## Архитектур

```
Internet ─▶ :80/:443 ─▶ Nginx ─▶ Next.js (3000)
                          │
                          ├──▶ Postgres   (internal :5432)
                          └──▶ MinIO      (internal :9000)
```

Бүгд нэг VM, бүгд docker-аар, тусдаа volume-ууд.

## Урьдчилсан шаардлага

- Сэргээсэн Ubuntu 22.04 эсвэл 24.04 VM (~2GB RAM, ~40GB disk хангалттай эхлэхэд)
- SSH access (нэвтэрсэн user)
- VM-ийн public IP-руу заагдсан **домэйн** (A record) — SSL авахад заавал. **Домэйн хараахан байхгүй бол доорх "Домэйнгүй эхлэх" хэсгийг үз.**

## 1. Серверийг бэлдэх

```bash
ssh root@<server-ip>
# эсвэл: ssh ubuntu@<server-ip> && sudo -i

git clone https://github.com/buy-aka/baby-timelapse.git /opt/baby-timelapse
cd /opt/baby-timelapse

bash deploy/setup-server.sh
```

Энэ скрипт:
- Docker суулгана
- UFW (firewall)-г 80, 443, SSH-д нээнэ
- fail2ban асаана
- 1GB swap үүсгэнэ

## 2. Environment бөглөх

```bash
cp .env.production.example .env

# Strong password үүсгэх
openssl rand -hex 32   # → BETTER_AUTH_SECRET
openssl rand -hex 24   # → POSTGRES_PASSWORD
openssl rand -hex 24   # → MINIO_ROOT_PASSWORD

nano .env
```

`.env` дотор:
- `POSTGRES_PASSWORD` — DB password
- `DATABASE_URL` — postgresql://app:PASSWORD@localhost:5432/baby_timelapse (host-аас холбогдоход)
- `BETTER_AUTH_SECRET` — random hex
- `BETTER_AUTH_URL` — https://your-domain.com
- `NEXT_PUBLIC_APP_URL` — https://your-domain.com
- `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` — Object Storage credentials

## 3 & 4. Nginx + SSL

Хоёр хувилбарын аль нэгийг сонго:

### Вариант A — Домэйнтэй (production, HTTPS)

```bash
# 3. Nginx-д домэйн оноох
sed -i 's/__DOMAIN__/your-domain.com/g' deploy/nginx/conf.d/app.conf

# 4. SSL (Let's Encrypt)
bash deploy/init-ssl.sh your-domain.com you@email.com
```

`init-ssl.sh` нь:
- Түр self-signed cert үүсгэх
- Nginx-ийг асаах
- Certbot-аар жинхэнэ SSL cert авах
- Nginx-ийг reload

DNS A record нь VM-ийн IP-руу зөв заагдсан байх ёстой.

### Вариант B — Домэйнгүй (эхний ээлж, зөвхөн IP + HTTP)

Домэйн хараахан тодорхой болоогүй бол SSL-гүй, зөвхөн IP-ээр HTTP дээр асаана.

```bash
# SSL config-ийг HTTP-only config-оор солих
cp deploy/nginx/app-http.conf deploy/nginx/conf.d/app.conf
```

`.env` дотор URL-уудыг **http://<server-ip>** болго (https биш):

```bash
BETTER_AUTH_URL=http://<server-ip>
NEXT_PUBLIC_APP_URL=http://<server-ip>
```

> ⚠️ HTTP дээр траффик шифрлэгдэхгүй. Зөвхөн эхний туршилт/staging-д ашигла, бодит хэрэглэгчийн өгөгдөл оруулахаас өмнө домэйн+SSL руу шилж.

Дараа нь шууд **5-р алхам** руу үсэр (`init-ssl.sh` ажиллуулахгүй).

**Домэйн гарсны дараа HTTPS руу шилжих:**

```bash
git checkout deploy/nginx/conf.d/app.conf
sed -i 's/__DOMAIN__/your-domain.com/g' deploy/nginx/conf.d/app.conf
bash deploy/init-ssl.sh your-domain.com you@email.com
# .env доторх URL-уудыг https://your-domain.com болгож засаад app-ийг restart:
docker compose -f docker-compose.prod.yml up -d
```

## 5. Бүх стек-ийг асаах

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Эхний удаад Docker image build хийгдэнэ (~3-5 мин).

## 6. DB migration ажиллуулах

```bash
docker compose -f docker-compose.prod.yml exec app sh -c "node node_modules/drizzle-kit/bin.cjs migrate"
```

Энэ нь `drizzle/` доторхи бүх migration-уудыг application хийнэ.

## 7. Туршилт

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Browser: `https://your-domain.com` (домэйнгүй бол `http://<server-ip>`) → Sign up → Onboarding → Photo upload.

---

## Шинэчлэлт хийх

```bash
cd /opt/baby-timelapse
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app sh -c "node node_modules/drizzle-kit/bin.cjs migrate"
```

## Backup

### Postgres
```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U app -d baby_timelapse | gzip > backup-$(date +%F).sql.gz
```

### MinIO (зураг)
```bash
docker run --rm --network baby-timelapse_default \
  -v $(pwd)/backups:/backup \
  minio/mc:latest sh -c "
    mc alias set src http://minio:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD &&
    mc mirror src/baby-photos /backup/photos-\$(date +%F)
  "
```

Сар бүр offsite (Backblaze B2, AWS S3) руу мирор хийхийг зөвлөнө.

## Үндсэн логийг харах

```bash
docker compose -f docker-compose.prod.yml logs -f app       # Next.js
docker compose -f docker-compose.prod.yml logs -f nginx     # Nginx
docker compose -f docker-compose.prod.yml logs -f postgres  # DB
docker compose -f docker-compose.prod.yml logs -f minio     # Storage
```

## Анхаарах зүйлс

1. **Email** — `forgot password` одоо имэйл илгээдэггүй (`console.log`-д хэвлэнэ). Production-д Resend/SendGrid/etc-тэй холбохын тулд `lib/auth.ts`-ийг шинэчилнэ.
2. **MinIO Console** (port 9001) гадагшаа гарахгүй — нэн чухал зүйлийг сольсон бол docker-compose.prod.yml-д `9001:9001` нэмж SSH tunnel-ээр харна.
3. **Backup-ыг автомат болго** — cron-оор сар бүр S3/B2 руу мирор хийх script тавь.
4. **Fail2ban** — SSH brute-force-аас хамгаална. Нэмэлт rule-ыг `/etc/fail2ban/jail.local`-д тохируулна.
