# Project Event 012 — FlashBillr catalogue import architecture

Date: 24 July 2026
Progress: remains 25%
Status: Architecture and migration draft complete; no database migration executed.

## Decision

FlashBillr will not be called by the public website. It is an upstream source used by a protected server-side importer. The dedicated Gowtham Fireworks Supabase database remains the catalogue source of truth.

## Completed

- Added `docs/FLASHBILLR_TO_SUPABASE_IMPORT_ARCHITECTURE.md`.
- Added `supabase/migrations/20260724070000_flashbillr_catalogue_import.sql`.
- Added server-only FlashBillr placeholders to `.env.example`.
- Added audit runs, staged import items, external mappings, per-product owner override controls, indexes and admin-only RLS policies.
- Established no-hard-delete and no-automatic-publication rules.

## Not completed

- FlashBillr API endpoint and response contract are not yet confirmed.
- Import adapter is not implemented.
- No Supabase schema or migration has been executed.
- Public catalogue still uses demo data.

## Exact next step

Obtain one confirmed FlashBillr product-list request/response or the existing frontend service file that uses `VITE_STORE_ID`, then implement the server-side adapter and transactional Supabase upsert.
