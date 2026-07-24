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
- Certbot-аар жинхэнэ SSL cert авах (docker compose run --rm --entrypoint "" certbot certonly ...)
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

> `BETTER_AUTH_URL` нь гол (runtime — cookie security, callback). Auth client нь
> same-origin ашигладаг тул `NEXT_PUBLIC_APP_URL`-аас хамаардаггүй; гэхдээ
> тууштай байлгахын тулд хоёуланг нь адил тавь.

> ⚠️ HTTP дээр траффик шифрлэгдэхгүй. Зөвхөн эхний туршилт/staging-д ашигла, бодит хэрэглэгчийн өгөгдөл оруулахаас өмнө домэйн+SSL руу шилж.

Дараа нь шууд **5-р алхам** руу үсэр (`init-ssl.sh` ажиллуулахгүй).

**Домэйн гарсны дараа HTTPS руу шилжих:**

```bash
git checkout deploy/nginx/conf.d/app.conf
sed -i 's/__DOMAIN__/your-domain.com/g' deploy/nginx/conf.d/app.conf
bash deploy/init-ssl.sh your-domain.com you@email.com
# .env доторх URL-уудыг https://your-domain.com болго, дараа нь container-ийг
# дахин үүсгэж шинэ env-ийг авна (URL-ууд runtime тул rebuild шаардахгүй):
docker compose -f docker-compose.prod.yml up -d
```

## 5. Бүх стек-ийг асаах

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Эхний удаад Docker image build хийгдэнэ (~3-5 мин).

## 6. DB migration ажиллуулах

```bash
docker compose -f docker-compose.prod.yml exec app node lib/db/migrate.mjs
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
docker compose -f docker-compose.prod.yml exec app node lib/db/migrate.mjs
```

## Багцын горим

**Багц wire.mn-ээр төлбөртэй идэвхжинэ.** Урсгал: хэрэглэгч багц сонгоно →
`/api/billing/checkout` wire-д PaymentIntent + Checkout session үүсгэж, дүн,
багц, intent id-г захиалгад бинд хийнэ → хэрэглэгч wire-ийн хуудсанд QR/банкны
аппаар төлнө → wire `payment_intent.succeeded` webhook-ийг
`/api/billing/wire-webhook`-руу илгээнэ → IP (65.109.117.186) + HMAC гарын
үсэг + wire API-ээс intent-ийг дахин уншиж тулгасны дараа багц идэвхжинэ.

Шаардлагатай env: `WIRE_API_KEY` (dashboard → API key), `WIRE_WEBHOOK_SECRET`
(dashboard → Webhook → endpoint нэмэхэд нэг л удаа харагдана). Secret
тавигдаагүй үед webhook 200 буцаадаг ч идэвхжүүлдэггүй (endpoint
баталгаажуулалт дамждаг).

Багцын жилийн хугацаа **гэр бүлийн эхний зураг оруулсан өдрөөс** тоологдоно
(жишээ: 3 сарын 3-нд эхний зураг орсон бол багц дараа жилийн 3 сарын 3-нд
дуусна). Идэвхжүүлэх үед зураг байхгүй бол `period_ends_at = NULL` буюу цаг
эхлээгүй — эхний зураг ормогц автоматаар бөглөгдөнө.

Захиалгын төлөв харах:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U app -d baby_timelapse -c \
  "SELECT f.name, s.plan, s.trial_ends_at, s.period_ends_at
   FROM subscription s JOIN family f ON f.id = s.family_id;"
```

Гараар засах шаардлага гарвал (жишээ нь хугацаа өөрчлөх):

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U app -d baby_timelapse -c \
  "UPDATE subscription SET plan = 'plus', period_ends_at = '2027-03-03', updated_at = now()
   WHERE family_id = '<FAMILY_ID>';"
```

Хэрэв webhook алдаад төлбөр орсон ч багц идэвхжээгүй бол логоос
`[wire-webhook] АНХААР` мөрийг хайж, дээрх UPDATE-аар гараар идэвхжүүлнэ
(wire dashboard-ын "Дахин илгээх" товч ч event-ийг дахин явуулдаг).

### Мөрдөгддөг хязгаарууд (API талд)

- **Өдөрт 1 зураг** — нэг хүүхдэд нэг өдөрт нэг timelapse зураг (upload
  болон огноо засахад шалгана; хуучин давхардсан өгөгдөлд үл хамаарна).
- **6 гишүүн** — эзэмшигчээс гадна 6 хүн урьж болно (урилга үүсгэх +
  хүлээн авах хоёуланд шалгана). `lib/plans.ts`-ийн `MAX_INVITED_MEMBERS`.
- **Цомог (album)** — зөвхөн идэвхтэй Plus багцад, 20GB
  (`ALBUM_LIMIT_BYTES`). Устгахад мөр + MinIO объект хамт устдаг.
- **Багц дууссан** — шинэ зураг нэмэх хаагдана, үзэх нь нээлттэй үлдэнэ.
- Зургууд `/api/image/<file>`-ээр зөвхөн нэвтэрсэн гэр бүлийн гишүүдэд
  очно (өмнө нь нээлттэй байсан).
- **Бичлэг татах** — `/api/video` сервер талд ffmpeg-ээр mp4 үүсгэнэ
  (Dockerfile-д ffmpeg суудаг, nginx-д 300с timeout). Хязгаар:
  Basic/туршилт 7 хоногт 1, Plus өдөрт 1 (`video_download` хүснэгтээр,
  амжилттай үүссэний дараа л тоологдоно).

## DataGrip / DBeaver-ээс холбогдох (SSH tunnel)

Postgres нь зөвхөн серверийн `127.0.0.1:5432`-д нээлттэй (интернэтэд ил биш).
Холбогдохын тулд DB tool-ийн SSH tunnel-ийг ашиглана:

**SSH tunnel:**
- Host: `103.41.113.114`, Port: `22`
- User: `ubuntu`
- Auth: **Key pair** → `babykey.pem`

**Database (tunnel-ийн цаана):**
- Host: `localhost` (эсвэл `127.0.0.1`), Port: `5432`
- Database: `baby_timelapse`
- User: `app`
- Password: `.env`-ийн `POSTGRES_PASSWORD`

> ⚠️ Энэ бол **бодит production** өгөгдөл. Устгах/өөрчлөх query-д болгоомжтой
> хандана. Зөвхөн харах бол read-only горим/эрх ашиглахыг зөвлөнө.

## Backup (автомат)

`deploy/backup.sh` нь Postgres-ийн логик dump + MinIO зургийн volume-ийн
архивыг `/opt/baby-timelapse/backups/`-д хийж, 14 хоног хадгална.

### Cron-д суулгах (өдөрт нэг удаа, 03:30-д)

```bash
cd /opt/baby-timelapse
chmod +x deploy/backup.sh

# Гараар нэг удаа туршиж үз:
sudo deploy/backup.sh
ls -lh backups/            # db-*.sql.gz болон minio-*.tar.gz гарсан байх ёстой
cat backups/backup.log

# root-ийн crontab-д нэмэх (docker-д sudo хэрэгтэй тул root):
sudo crontab -e
# дараах мөрийг нэмнэ:
30 3 * * * /opt/baby-timelapse/deploy/backup.sh
```

> ⚠️ Backup нь одоогоор **зөвхөн тэр серверийн диск дээр** хадгалагдана.
> Сервер бүрэн эвдэрвэл backup ч бас алдагдана. Скриптийн `OFFSITE`
> хэсгийг (rclone → Backblaze B2 / S3) идэвхжүүлж offsite хуулбар авахыг
> хүчтэй зөвлөнө.

### Сэргээх (restore)

```bash
cd /opt/baby-timelapse

# 1. Postgres — сүүлийн dump-аас:
gunzip -c backups/db-<DATE>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U app -d baby_timelapse

# 2. MinIO зураг — volume руу задлах (app-ыг түр зогсоож болно):
MINIO_VOL=$(docker inspect baby-timelapse-storage \
  -f '{{ range .Mounts }}{{ if eq .Destination "/data" }}{{ .Name }}{{ end }}{{ end }}')
docker run --rm -v "$MINIO_VOL":/data -v "$PWD/backups":/backup \
  alpine sh -c "tar xzf /backup/minio-<DATE>.tar.gz -C /data"
docker compose -f docker-compose.prod.yml restart minio
```

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
