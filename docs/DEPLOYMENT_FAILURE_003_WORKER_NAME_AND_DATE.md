# Deployment Failure 003 — Worker name mismatch and future compatibility date

Date observed: 23 July 2026 UTC / 24 July 2026 India time

## Result before failure

The corrected Cloudflare build completed successfully:

- dependencies installed;
- `npm run cf:build` executed;
- OpenNext invoked `$ next build` exactly once;
- Next.js compiled successfully;
- TypeScript passed;
- 21 routes generated;
- `.open-next/worker.js` created;
- OpenNext build completed;
- static assets uploaded.

## Deployment failure

Cloudflare then reported:

```text
Failed to match Worker name. Config used "gowtham-fireworks" but CI expected "gowthamfireworks".
```

and:

```text
Can't set compatibility date in the future: 2026-07-24
Cloudflare error code: 10021
```

## Root cause

1. The connected Cloudflare Worker project name was `gowthamfireworks`, while `wrangler.jsonc` used `gowtham-fireworks`.
2. Cloudflare validated the compatibility date using UTC. During the deployment, Cloudflare UTC was still 23 July 2026, so `2026-07-24` was rejected as a future date.

## Fix

`wrangler.jsonc` was changed to:

```jsonc
{
  "name": "gowthamfireworks",
  "compatibility_date": "2026-07-23"
}
```

The remaining configuration stays first-deploy-safe:

- `.open-next/worker.js` is the Worker entry;
- `.open-next/assets` is the asset directory;
- `nodejs_compat` remains enabled;
- no `WORKER_SELF_REFERENCE` binding;
- no R2 incremental-cache binding.

## Required Cloudflare settings

```text
Build command: npm run cf:build
Deploy command: npx wrangler deploy
```

## Verification required

A fresh connected deployment must confirm:

- no Worker name override warning;
- no error code 10021;
- Worker `gowthamfireworks` is created or updated;
- a `workers.dev` URL is returned;
- main routes load.
