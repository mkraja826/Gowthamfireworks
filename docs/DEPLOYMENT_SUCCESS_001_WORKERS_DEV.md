# Gowtham Fireworks — Deployment Success 001

Date: 24 July 2026
Environment: Cloudflare Workers staging
Status: SUCCESS

## Deployment result

The redesigned Next.js/OpenNext application built and deployed successfully to Cloudflare Workers.

Worker:
- Name: `gowthamfireworks`
- URL: `https://gowthamfireworks.karthikraja826.workers.dev`
- Version ID: `8f78e53d-ada2-4db3-8029-c55fdccc20e2`
- Worker startup time: 31 ms

## Verified by Cloudflare build log

- Bun installed 621 packages.
- Cloudflare build command executed: `npm run cf:build`.
- OpenNext invoked `next build` exactly once.
- Next.js compiled successfully.
- TypeScript completed successfully.
- 21 static/SSG pages were generated.
- `.open-next/worker.js` was created.
- 37 static assets were discovered.
- 19 new or modified assets were uploaded.
- Worker script uploaded successfully.
- Worker triggers deployed successfully.
- Deploy command completed successfully.
- Entire Cloudflare build completed successfully.

## Routes present in the build

Public/customer:
- `/`
- `/catalogue`
- `/catalogue/[slug]`
- `/cart`
- `/login`
- `/wholesale`
- `/onboarding/account-type`
- `/onboarding/personal`
- `/business/apply`

Admin:
- `/admin`
- `/admin/login`
- `/admin/products`
- `/admin/applications`
- `/admin/requests`

## Deployment configuration that worked

```text
Build command: npm run cf:build
Deploy command: npx wrangler deploy
Worker name: gowthamfireworks
Compatibility date: 2026-07-23
```

## Non-blocking warning

Cloudflare could not upload dependency/build caches because no committed package-manager lockfile was detected. This did not affect the successful build or deployment.

A reproducible lockfile and build caching should be added later to speed future builds and pin dependency versions.

## Verification still required

- Open the Worker URL in desktop and mobile browsers.
- Review `/`, `/catalogue`, product details, `/cart`, `/login`, `/wholesale`, and `/admin/login`.
- Check responsive layout at 360 px, 390 px, 430 px, tablet and desktop widths.
- Confirm no runtime errors in Cloudflare Worker logs.
- Add real logo, factory and product imagery before production-domain acceptance.
- Keep the existing live domain unchanged until staging acceptance.
