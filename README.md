# YO1Cashback

Production-ready cashback platform — earn cashback on every purchase and withdraw real money.

- **Domain:** https://yo1cashback.com
- **Frontend:** Next.js 15 (App Router) + React 19 + TailwindCSS + React Query + React Hook Form + Framer Motion + Firebase Auth
- **Backend:** Node.js + TypeScript + Express + MongoDB (Mongoose) + JWT + Firebase Admin SDK + Bcrypt + Helmet + CORS + Morgan + Express Validator
- **Deployment:** OCI Ubuntu + PM2 + Nginx + Let's Encrypt SSL

> This is a fully isolated project. It has no dependency on any YOlast database, collections, backend code, or environment variables.

## Repository layout

```
yo1cashback/
├── backend/          # Express API
│   └── src/
│       ├── config/   # env, mongo, firebase-admin
│       ├── models/   # Mongoose schemas
│       ├── middleware/
│       ├── controllers/
│       ├── routes/
│       ├── services/ # cashback + referral logic
│       └── utils/    # helpers, logger, seed
├── frontend/         # Next.js 15 app
│   ├── app/          # App Router pages
│   ├── components/
│   ├── contexts/
│   └── lib/
└── deploy/           # nginx + deployment scripts
```

## Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (create a **new** dedicated database)
- A **new** Firebase project (Auth enabled with Phone (OTP) and Google providers)

## Backend setup (TypeScript)

```bash
cd backend
cp .env.example .env    # fill in MongoDB URI, JWT secret, Firebase Admin credentials
npm install
npm run dev             # tsx watch — http://localhost:5000
npm run build           # tsc -> dist/
npm run seed            # seeds settings + Super Admin (tsx)
npm run typecheck       # tsc --noEmit
npm run lint            # typescript-eslint
```

### Firebase Admin SDK

1. Firebase Console → Project settings → Service accounts → Generate new private key.
2. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (keep `\n` escapes) in `.env`.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (used by `npm run seed` to create the default Super Admin).

## Authentication & roles

- **Mobile OTP** — Firebase Phone auth (`signInWithPhoneNumber` + reCAPTCHA).
- **Google** — Firebase Google popup auth.

Customer flow: sign in → Firebase verifies → backend verifies the Firebase ID token (Admin SDK) → creates/updates the Mongo user → creates a `customerSessions` + `loginLogs` entry → issues JWT → dashboard.

- **Admin** — email + password (bcrypt) via `POST /api/auth/admin/login`. The default Super Admin is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Two roles:
- **Super Admin** (`admins` collection) — full admin panel at `/admin` (email + password).
- **Customer** (`users` collection) — normal user.

## Frontend setup

```bash
cd frontend
cp .env.example .env.local   # fill in Firebase web app config
npm install
npm run dev                  # http://localhost:3000
```

The frontend proxies `/api/*` to the backend via `next.config.mjs` rewrites (also set `NEXT_PUBLIC_API_URL`).

## Database

Database `yo1cashback` — Mongoose models map to these exact collections:

| Collection | Model | Purpose |
|------------|-------|---------|
| `admins` | Admin | Admin staff (separate from customers) |
| `users` | User | Customers |
| `wallets` | Wallet | Per-user spendable/earned balances |
| `customerCashbackSummary` | CustomerCashbackSummary | Lifetime cashback stats per customer |
| `cashbackQueue` | CashbackQueue | Cashback lifecycle (pending → confirmed → paid) |
| `transactions` | Transaction | Order records |
| `withdrawalRequests` | WithdrawalRequest | Payout requests |
| `customerSessions` | CustomerSession | User sessions |
| `loginLogs` | LoginLog | Authentication audit log |
| `notifications` | Notification | In-app notifications |
| `tickets` | Ticket | Support tickets |
| `ticketMessages` | TicketMessage | Support ticket messages |
| `settings` | Setting | Key/value configuration |

The merchant/store catalog schema will be added separately.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/firebase` | Exchange Firebase idToken for JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user (with wallet) |
| GET | `/api/users/dashboard` | Wallet + summary + recent cashback |
| GET | `/api/cashback` | My cashback queue items (auth) |
| POST | `/api/cashback` | Track a cashback entry (auth) |
| GET | `/api/transactions` | My order records (auth) |
| POST | `/api/withdrawals` | Request withdrawal (auth) |
| GET | `/api/referrals` | Referral summary (auth) |
| GET | `/api/notifications` | My notifications (auth) |
| POST | `/api/tickets` | Open support ticket (auth) |
| POST | `/api/postback` | Affiliate network postback |
| GET | `/api/admin/stats` | Admin dashboard (admin) |

## Cashback flow

1. An order is recorded in `transactions` and cashback is enqueued in `cashbackQueue` as `pending`.
2. The entry can originate from `/api/postback` (affiliate network), the admin panel (manual), or `/api/cashback` (tracked).
3. On confirmation the entry moves to `confirmed`: the user's `wallets.balance` is credited, `customerCashbackSummary` is updated, and the referrer (if any) earns a bonus.
4. The user requests a withdrawal (`withdrawalRequests`) → admin approves → paid out.

## Deployment (OCI Ubuntu)

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

The script installs Node, PM2, Nginx, builds the frontend, and provisions SSL with Certbot across all three domains (`yo1cashback.com`, `www.yo1cashback.com`, `api.yo1cashback.com`). See `deploy/DEPLOYMENT.md` for the full OCI guide and `deploy/nginx/yo1cashback.conf` for the reverse proxy config.

## Environment variables

- `backend/.env.example` — server configuration
- `frontend/.env.example` — client Firebase + API URLs

## License

Private. All rights reserved.
