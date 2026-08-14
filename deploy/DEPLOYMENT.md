# YO1Cashback — OCI Deployment Guide

Production deployment on an **Oracle Cloud Infrastructure (OCI) Ubuntu** VM using PM2 + Nginx + Let's Encrypt.

## Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │                 Nginx (443)                 │
                 ├──────────────┬──────────────┬───────────────┤
                 │ yo1cashback.com / www        │ api.yo1cashback.com │
                 └──────┬───────┴──────┬───────┴───────┬───────┘
                        │              │               │
                 Next.js (:3000)        └───────── Express API (:5000)
                        │                          (PM2 cluster ×2)
```

- **Frontend:** `yo1cashback.com` + `www.yo1cashback.com` → Next.js on `127.0.0.1:3000`
- **API:** `api.yo1cashback.com` → Express on `127.0.0.1:5000`

---

## 1. Prerequisites

- An OCI VM instance (Ubuntu 22.04+), port `80` and `443` open in the **Security List / NSG**.
- A DNS A record for each domain pointing to the VM's public IP:
  - `yo1cashback.com`
  - `www.yo1cashback.com`
  - `api.yo1cashback.com`
- A MongoDB Atlas cluster (see §5).

---

## 2. MongoDB Atlas Setup

1. Create a cluster (or reuse) and note the connection string region.
2. **Database user** — `Database Access → Add New Database User`:
   - Username: `yo1cashback_app`
   - Password: strong, unique (the one in `backend/.env`)
   - Role: `readWriteAnyDatabase` (or scoped to `yo1cashback`).
3. **Network access** — `Network Access → Add IP Address`:
   - Add your OCI VM public IP (and/or `0.0.0.0/0` for dev — production should restrict to the VM IP).
4. Connection string (note the **database name** is `yo1cashback`):

```
mongodb+srv://yo1cashback_app:<password>@cluster0.gthoo2c.mongodb.net/yo1cashback?appName=Cluster0
```

---

## 3. Environment Setup

### Backend — `backend/.env`

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yo1cashback.com,https://www.yo1cashback.com
API_URL=https://api.yo1cashback.com

MONGODB_URI=mongodb+srv://yo1cashback_app:<password>@cluster0.gthoo2c.mongodb.net/yo1cashback?appName=Cluster0

JWT_SECRET=<long-random-secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CLIENT_EMAIL=<firebase-adminsdk-...@<project>.iam.gserviceaccount.com>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...paste full key here...
-----END PRIVATE KEY-----
"

ADMIN_EMAIL=admin@yo1cashback.com
ADMIN_PASSWORD=<strong-password>

MIN_WITHDRAWAL=10
MAX_WITHDRAWAL=0
REFERRAL_BONUS_RATE=10
CASHBACK_CONFIRM_DAYS=30
```

> `CLIENT_URL` is comma-separated; the API accepts CORS from all listed origins.

### Frontend — `frontend/.env.local` (production)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-web-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

NEXT_PUBLIC_API_URL=https://api.yo1cashback.com
NEXT_PUBLIC_SITE_URL=https://yo1cashback.com
```

> Rebuild the frontend after changing `.env.local` (`npm run build`) — env vars are inlined at build time.

---

## 4. Install & Deploy

```bash
# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# PM2
sudo npm install -g pm2

# Clone & install (backend is TypeScript — build before running)
sudo mkdir -p /var/www/yo1cashback && sudo chown $USER:$USER /var/www/yo1cashback
git clone <repo-url> /var/www/yo1cashback
cd /var/www/yo1cashback/backend
npm ci
npm run build                          # tsc -> dist/

# Seed settings + Super Admin (run once, from backend/)
node dist/utils/seed.js
```

---

## 5. PM2 Commands

```bash
cd /var/www/yo1cashback/backend

pm2 start ecosystem.config.cjs         # start yo1cashback-api (cluster ×2)
pm2 status                             # list processes
pm2 logs yo1cashback-api               # tail logs (--lines 200)
pm2 monit                              # CPU/memory dashboard
pm2 restart yo1cashback-api            # restart
pm2 reload yo1cashback-api             # zero-downtime reload
pm2 delete yo1cashback-api             # stop & remove

# Frontend (Next.js) via PM2
cd /var/www/yo1cashback/frontend && npm run build
pm2 start npm --name yo1cashback-web -- start

pm2 save                               # persist process list
pm2 startup systemd                    # generate boot script (run the printed command)
```

> `ecosystem.config.cjs` runs the compiled `dist/server.js` with 2 clustered instances
> (`instance_var=NODE_APP_INSTANCE`); the background jobs (scheduler) run only on instance `0`
> to avoid duplicates. After a backend code change, rebuild then reload:
> `npm ci && npm run build && pm2 reload yo1cashback-api`.

---

## 6. Nginx Commands

```bash
# Install config
sudo cp /var/www/yo1cashback/deploy/nginx/yo1cashback.conf /etc/nginx/sites-available/yo1cashback
sudo ln -sf /etc/nginx/sites-available/yo1cashback /etc/nginx/sites-enabled/yo1cashback
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t
sudo systemctl reload nginx

# Status / logs
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 7. SSL Commands (Let's Encrypt / Certbot)

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# HTTP-01 challenge directory
sudo mkdir -p /var/www/certbot

# Issue one SAN certificate covering all three domains
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d yo1cashback.com -d www.yo1cashback.com -d api.yo1cashback.com \
  --email admin@yo1cashback.com --agree-tos --no-eff-email

# Then reload nginx (cert paths already point at /etc/letsencrypt/live/yo1cashback.com)
sudo nginx -t && sudo systemctl reload nginx

# Auto-renewal (cron installed automatically by certbot; test with):
sudo certbot renew --dry-run
```

> The provided `yo1cashback.conf` is **SSL-ready**: HTTPS server blocks reference
> `/etc/letsencrypt/live/yo1cashback.com/fullchain.pem`. Run the certbot command above to
> create the certificate, then reload nginx.

---

## 8. Verify

```bash
curl -s https://api.yo1cashback.com/api/health
# {"success":true,"message":"YO1Cashback API is running",...}

curl -I https://yo1cashback.com            # 200
curl -I https://www.yo1cashback.com        # 200
```

---

## 9. Common Operations

| Task | Command |
|------|---------|
| Deploy backend changes | `git pull && npm ci && npm run build && pm2 reload yo1cashback-api` |
| Deploy frontend changes | `git pull && npm ci && npm run build && pm2 restart yo1cashback-web` |
| View API logs | `pm2 logs yo1cashback-api` |
| View web logs | `pm2 logs yo1cashback-web` |
| Roll back | `pm2 restart yo1cashback-api --update-env` |
