# Carautos Backend

Express API backed by MySQL through `mysql2`.

## Setup

1. Copy `.env.example` to `.env`.
2. Update the `DB_*` values for your MySQL server.
3. Set `JWT_SECRET` to a long random value.
4. Run migrations and seeds:

```sh
npm run migrate
npm run seed
```

For a local MySQL server with Docker:

```sh
docker compose up -d
cp .env.example .env
npm run migrate
npm run seed
```

For local development with seed data checked on startup:

```sh
npm run dev
```

## Public Routes

- `GET /api/health`
- `GET /api/auction-items`
- `GET /api/auction-items?category=Cars`
- `GET /api/auction-items/:id`
- `GET /api/crypto-wallets`
- `POST /api/auth/register`
- `POST /api/auth/login`

Seed admin login:

- Email: `admin@royalmileauctions.com`
- Password: `AdminPass123!`

Seed buyer login:

- Email: `buyer@example.com`
- Password: `UserPass123!`

## User Routes

Send `Authorization: Bearer <token>` from `/api/auth/login`.

- `GET /api/users/me`
- `GET /api/users/me/bids`
- `GET /api/bids`
- `POST /api/bids`
- `GET /api/payments`
- `POST /api/payments`

## Admin Routes

Send an admin `Authorization: Bearer <token>` from `/api/auth/login`.

- `GET /api/admin/auction-items`
- `POST /api/admin/auction-items`
- `PUT /api/admin/auction-items/:id`
- `DELETE /api/admin/auction-items/:id`
- `GET /api/admin/crypto-wallets`
- `POST /api/admin/crypto-wallets`
- `PUT /api/admin/crypto-wallets/:id`
- `DELETE /api/admin/crypto-wallets/:id`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`

Auction item image upload field: `image`.

Crypto wallet QR upload field: `qrCode`.
