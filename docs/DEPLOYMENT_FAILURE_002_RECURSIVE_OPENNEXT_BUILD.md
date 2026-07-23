# Deployment Failure 002 — Recursive OpenNext build

Date: 24 July 2026
Repository: mkraja826/Gowthamfireworks
Status: ROOT CAUSE FIXED; REDEPLOY PENDING

## Observed behaviour

Cloudflare deployment remained in the build stage for 20 minutes or longer.
The log repeatedly printed:

```text
OpenNext — Cloudflare build
$ opennextjs-cloudflare build
```

No Next.js compilation stage was reached because the same OpenNext command continually launched another OpenNext process.

## Root cause

The package script was configured as:

```text
build = opennextjs-cloudflare build
```

OpenNext invokes the package `build` script internally to compile the Next.js application. Therefore the execution became recursive:

```text
opennextjs-cloudflare build
  -> npm run build
     -> opennextjs-cloudflare build
        -> npm run build
           -> repeated indefinitely
```

## Fix

The scripts are now separated:

```text
build = next build
cf:build = opennextjs-cloudflare build
```

Cloudflare Git settings must use:

```text
Build command: npm run cf:build
Deploy command: npx wrangler deploy
```

The build script must remain `next build` because OpenNext calls it internally.

## Fix commits

- package.json recursion fix: 0c9c44f65919c6b99373be27452085f67dcb0337
- deployment documentation correction: 4490c8083a6482e9e21b65977c3248fc7de7c6d2

## Verification pending

- Start a fresh deployment from the latest main branch.
- Confirm the log shows one OpenNext build heading followed by `$ next build`.
- Confirm Next.js compilation, TypeScript and page generation complete.
- Confirm Wrangler deploys `gowtham-fireworks` successfully.
