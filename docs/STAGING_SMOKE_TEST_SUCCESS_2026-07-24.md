# Staging smoke test — success

Date: 24 July 2026

## Deployment

- Worker: `gowthamfireworks`
- Staging URL: `https://gowthamfireworks.karthikraja826.workers.dev`
- Version ID: `105fd563-d68b-49fa-905b-98fcf620db8c`

## Verified routes

All routes returned HTTP 200:

- `/`
- `/catalogue`
- `/cart`
- `/login`
- `/admin/login`

## Safety state

- The existing production domain was not changed.
- The public catalogue still uses demo data.
- All 235 imported FlashBillr products remain draft and unpublished.
- The next check is to verify that the public Supabase publishable key returns zero product rows under RLS.
