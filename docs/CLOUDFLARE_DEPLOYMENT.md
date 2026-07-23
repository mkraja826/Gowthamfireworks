# Gowtham Fireworks — Cloudflare Workers deployment

## Current deployment model

The Next.js application is deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

The repository contains the required configuration files:

- `wrangler.jsonc`
- `open-next.config.ts`
- OpenNext/Wrangler scripts in `package.json`

## Cloudflare build settings

Keep these commands in the Cloudflare Workers Git build configuration:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
```

`npm run build` now runs `opennextjs-cloudflare build`, which internally runs the Next.js production build and writes:

- `.open-next/worker.js`
- `.open-next/assets`

The deploy command then uploads those checked outputs using the committed `wrangler.jsonc`.

## Failure fixed on 24 July 2026

The first deployment attempted `npx wrangler deploy` without a committed Wrangler/OpenNext configuration. Wrangler automatically migrated the project and generated:

- an R2 incremental cache binding;
- a `WORKER_SELF_REFERENCE` service binding to `gowtham-fireworks`.

Deployment failed with Cloudflare code `10143` because the service binding referenced `gowtham-fireworks` before that Worker existed.

The fix was to commit a manual first-deploy-safe configuration with no self-service binding:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "gowtham-fireworks",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-07-24",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

This follows Cloudflare's manual Next.js/OpenNext configuration and avoids any binding to a Worker that has not yet been created.

## Environment variables

Configure these in Cloudflare **Build Variables and secrets** before enabling Supabase-backed features:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_USE_TEST_OTP
```

Do not commit real secret values or `.dev.vars`.

## Local commands

```powershell
npm install
npm run typecheck
npm run lint
npm run build
npm run preview
```

Production deployment from a trusted local environment:

```powershell
npm run deploy
```

## Verification checklist

After deployment:

1. Open the generated `workers.dev` URL.
2. Verify `/`, `/catalogue`, `/cart`, `/login`, `/admin/login`, and `/admin`.
3. Check Worker logs for runtime errors.
4. Confirm no `WORKER_SELF_REFERENCE` binding appears.
5. Add the custom domain only after the preview deployment works.
