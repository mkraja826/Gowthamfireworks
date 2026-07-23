# Gowtham Fireworks — Cloudflare Workers deployment

## Current deployment model

The Next.js application is deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

The repository contains:

- `wrangler.jsonc`
- `open-next.config.ts`
- OpenNext and Wrangler dependencies
- separate Next.js and Cloudflare build scripts

## Cloudflare Git build settings

Use these exact commands:

```text
Build command: npm run cf:build
Deploy command: npx wrangler deploy
```

Do not set the Cloudflare build command to `npm run build`.

The script responsibilities are intentionally separated:

```text
npm run build     -> next build
npm run cf:build  -> opennextjs-cloudflare build
```

OpenNext invokes the package `build` script internally. Therefore, `build` must remain `next build`. Setting `build` to `opennextjs-cloudflare build` causes OpenNext to launch itself repeatedly and creates an infinite build loop.

`npm run cf:build` performs the complete Cloudflare build and writes:

- `.open-next/worker.js`
- `.open-next/assets`

The deploy command uploads those outputs using the committed `wrangler.jsonc`.

## Failures fixed on 24 July 2026

### Failure 1 — missing first Worker service binding

The first deployment allowed Wrangler to auto-migrate the Next.js project. It generated a `WORKER_SELF_REFERENCE` service binding to `gowtham-fireworks` before that Worker existed.

Cloudflare rejected the deployment with code `10143`.

Fix:

- commit a manual `wrangler.jsonc`;
- remove `WORKER_SELF_REFERENCE`;
- deploy `.open-next/worker.js` directly.

### Failure 2 — recursive OpenNext build

The package script was temporarily configured as:

```text
build = opennextjs-cloudflare build
```

OpenNext calls the package `build` script while building Next.js. That caused:

```text
opennextjs-cloudflare build
  -> package build
     -> opennextjs-cloudflare build
        -> package build
           -> repeated indefinitely
```

Symptoms:

- repeated “OpenNext — Cloudflare build” headings;
- repeated `$ opennextjs-cloudflare build` lines;
- deployment remained building for 20 minutes or longer.

Fix:

```text
build = next build
cf:build = opennextjs-cloudflare build
```

## Committed Wrangler configuration

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

## Environment variables

Configure these in Cloudflare Build Variables and secrets before enabling Supabase-backed features:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_USE_TEST_OTP
```

Do not commit real secret values or `.dev.vars`.

## Local verification

```powershell
npm install
npm run typecheck
npm run lint
npm run build
npm run cf:build
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
