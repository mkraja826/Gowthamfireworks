# Gowtham Fireworks Industries

A mobile-first retail and wholesale fireworks catalogue and requirement platform.

## Current build

This repository now contains the first working application foundation:

- Premium “Sivakasi Midnight Festival” landing page
- Responsive retail catalogue and product details
- Browser-persisted retail cart
- Supabase phone OTP screens with Test OTP support
- First-login Personal or Business routing
- Personal profile onboarding
- Business/wholesale application
- Direct pre-authorised admin login
- Owner dashboard and product-entry interface
- Version-controlled Supabase schema in `supabase/schema.sql`

The production default remains **requirement submission plus manual factory confirmation**. No payment gateway is included.

## Local setup

Requirements: Node.js 20.9 or newer.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase connection

Do not commit real credentials. Add these to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_ENABLE_TEST_AUTH=true
```

After the frontend is reviewed, run `supabase/schema.sql` in the dedicated Gowtham Fireworks Supabase project. Configure Supabase Test OTP phone numbers in the Auth dashboard before testing login.

## Admin bootstrap

The public UI never offers an Admin account type. After creating/verifying the owner Auth user, use the commented bootstrap SQL at the end of `supabase/schema.sql` to add the owner phone to `admin_allowlist` and assign `owner_admin` securely.

## Important

- Never use the CapDent or Astro Supabase project.
- Never commit service-role keys, database passwords, production `.env` files or customer documents.
- Keep business documents private.
- Verify legal, licensing, transport, service-region and production SMS/DLT requirements before launch.
