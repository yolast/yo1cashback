#!/usr/bin/env bash
# YO1Cashback OCI Ubuntu deployment script
set -euo pipefail

APP_DIR="/var/www/yo1cashback"
DOMAIN="yo1cashback.com"

echo "==> Installing system packages"
sudo apt-get update -y
sudo apt-get install -y nginx git curl

echo "==> Installing Node.js 20 via NodeSource"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installing PM2"
sudo npm install -g pm2

echo "==> Cloning repository"
if [ ! -d "$APP_DIR" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone <your-repo-url> "$APP_DIR"
fi

echo "==> Backend (TypeScript -> build -> run)"
cd "$APP_DIR/backend"
npm ci
[ -f .env ] || { echo "ERROR: backend/.env missing. Copy from .env.example"; exit 1; }
npm run build
node dist/utils/seed.js || echo "WARN: seed failed (check MongoDB network access)"
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Frontend"
cd "$APP_DIR/frontend"
npm ci
[ -f .env.local ] || { echo "ERROR: frontend/.env.local missing. Copy from .env.example"; exit 1; }
npm run build
pm2 start npm --name "yo1cashback-web" -- start
pm2 save

echo "==> Nginx"
sudo cp "$APP_DIR/deploy/nginx/yo1cashback.conf" "/etc/nginx/sites-available/yo1cashback"
sudo ln -sf "/etc/nginx/sites-available/yo1cashback" "/etc/nginx/sites-enabled/yo1cashback"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> SSL via Certbot (webroot, SAN across all three domains)"
sudo apt-get install -y certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" \
  --email "admin@$DOMAIN" --agree-tos --no-eff-email --non-interactive
sudo nginx -t && sudo systemctl reload nginx

echo "==> Done. Verify:"
echo "    https://api.$DOMAIN/api/health"
echo "    https://$DOMAIN"
