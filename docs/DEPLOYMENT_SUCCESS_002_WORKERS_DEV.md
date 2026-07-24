# Cloudflare workers.dev staging deployment 002 — success

Date: 24 July 2026

## Deployment result

The updated Gowtham Fireworks OpenNext bundle was deployed successfully to the existing Cloudflare Workers staging environment.

- Worker: `gowthamfireworks`
- Staging URL: `https://gowthamfireworks.karthikraja826.workers.dev`
- Version ID: `105fd563-d68b-49fa-905b-98fcf620db8c`
- Worker startup time: `28 ms`
- Total upload: `4976.45 KiB`
- Gzip upload: `1023.37 KiB`
- Assets scanned: `37`
- New or modified assets uploaded: `4`
- Existing assets reused: `28`
- Binding: `env.ASSETS`

## Build state deployed

- Next.js 16.2.11 production build passed.
- TypeScript passed.
- All 21 routes/static pages generated.
- OpenNext generated `.open-next/worker.js`.
- Local `.env.local` was detected during the build.
- The public catalogue still uses demo data.
- All 235 imported Supabase products remain draft and unpublished.

## Safety state

- Deployment targeted only the existing workers.dev staging Worker.
- The production domain `gowthamfireworksindustries.com` was not changed.
- No Supabase secret/service-role key was committed or placed in browser code.
- The Wrangler child-process deprecation warning was non-blocking and did not prevent deployment.

## Next verification

Run staging smoke tests for the homepage, catalogue, cart, login, admin login and WhatsApp links. Then verify that the Supabase publishable key returns zero draft products before enabling public Supabase catalogue queries.
