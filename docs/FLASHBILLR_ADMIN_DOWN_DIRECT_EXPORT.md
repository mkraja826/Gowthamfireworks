# FlashBillr admin frontend unavailable — direct export fallback

Date: 24 July 2026
Status: Implemented in the Gowtham Fireworks repository; local execution pending.

## Problem

The hosted FlashBillr admin website is unavailable, so a JWT cannot be copied from browser localStorage.

## Confirmed backend contract

The public `Aathirajan/flashbillr_admin` source confirms:

- login: `POST /api/auth/login` with `{ email, password }`;
- profile: `GET /api/auth/profile`;
- products: `GET /api/storeadmin/products?page=<n>&limit=<n>`;
- authentication: `Authorization: Bearer <JWT>`;
- product response: `{ products: [...], pagination: {...} }`.

## Implemented fallback

`scripts/fetch-flashbillr-products.mjs` now supports two authentication modes:

1. `FLASHBILLR_API_TOKEN` when a current JWT is already available;
2. `FLASHBILLR_ADMIN_EMAIL` and `FLASHBILLR_ADMIN_PASSWORD` when the hosted admin frontend is unavailable.

In credential mode the script:

1. posts the credentials directly to the backend login endpoint;
2. keeps the returned JWT in process memory only;
3. verifies the authenticated role is store admin;
4. verifies the authenticated store ID equals `cmfmpccfc000do5hjfkyh4ene`;
5. fetches every paginated product page;
6. writes `imports/flashbillr-products.json` locally;
7. makes no Supabase connection.

The local environment file is ignored by Git. Passwords and JWTs must never be committed or shared.

## Local command

Update `.env.import.local`:

```env
FLASHBILLR_STORE_ID=cmfmpccfc000do5hjfkyh4ene
FLASHBILLR_API_URL=https://flashbillr-mumbai-562462089707.asia-south1.run.app
FLASHBILLR_ADMIN_EMAIL=YOUR_EXISTING_STORE_ADMIN_EMAIL
FLASHBILLR_ADMIN_PASSWORD=YOUR_EXISTING_STORE_ADMIN_PASSWORD
FLASHBILLR_API_TOKEN=
```

Then run:

```powershell
git pull origin main
npm run fetch:flashbillr-products
```

If the backend is available and credentials are valid, the product export is saved locally. If the backend itself is unavailable, the command will fail with the HTTP/network error and no local catalogue or Supabase data will be changed.
