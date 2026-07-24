# FlashBillr → Supabase catalogue import architecture

Date: 24 July 2026
Status: Architecture approved; database migration drafted; API adapter pending exact FlashBillr endpoint/response contract.

## Decision

The Gowtham Fireworks public website must **not** call FlashBillr directly.

FlashBillr is an upstream catalogue source only. The dedicated Gowtham Fireworks Supabase database is the website source of truth.

## Server-only configuration

Use server-side environment variables. Do not expose these with `NEXT_PUBLIC_` or `VITE_` prefixes in the fireworks website.

```text
FLASHBILLR_STORE_ID=<store id>
FLASHBILLR_API_URL=<base API URL>
FLASHBILLR_API_TOKEN=<optional API credential>
FLASHBILLR_PRODUCTS_PATH=<confirmed products endpoint>
FLASHBILLR_SYNC_SECRET=<secret protecting manual sync endpoint>
```

The store ID and base URL identify the source. Any token or sync secret must be stored as a Cloudflare secret and never committed.

## Data flow

```text
FlashBillr API
  ↓ server-side fetch only
Import run + raw staging rows
  ↓ validation and normalization
Stable external-to-internal mappings
  ↓ transactional apply
Supabase categories / brands / products / images / prices / inventory
  ↓
Public website and admin dashboard
```

The public browser communicates only with the Gowtham Fireworks application and Supabase-approved APIs.

## Import sequence

1. An authorised owner triggers a manual import, or a scheduled server job starts it.
2. The server reads `FLASHBILLR_STORE_ID` and calls the confirmed FlashBillr endpoint.
3. A `catalogue_import_runs` row is created.
4. Every source record is copied into `catalogue_import_items` as raw JSON.
5. Data is normalized and validated without changing live catalogue tables.
6. Invalid records remain staged with validation errors.
7. Valid categories and brands are upserted first.
8. Products are upserted using stable `external_entity_mappings`.
9. Product images are downloaded by the server, validated, compressed and copied into Supabase Storage. The website must not permanently depend on FlashBillr image URLs.
10. Retail price changes close the prior current price and create a new effective price only when the amount changed.
11. Inventory is updated after product mapping succeeds.
12. The run is marked applied, partially applied or failed with counts and errors.

## Owner override rules

Each imported product receives `product_import_controls`.

The owner can prevent later imports from overwriting:

- name;
- description;
- category;
- brand;
- pack size;
- retail price;
- wholesale price;
- stock;
- images;
- visibility.

Defaults:

- names/descriptions/categories/brands/pack sizes: synchronized initially;
- retail price: synchronized;
- stock: synchronized;
- images: synchronized until the owner disables it;
- wholesale price: not synchronized unless explicitly approved;
- publication/visibility: never controlled automatically by FlashBillr.

## Missing products and deletion policy

External records must never cause immediate hard deletion.

When a previously mapped product is absent from a sync:

1. increment `missing_sync_count`;
2. keep it visible after the first missing run;
3. after repeated confirmed absence, mark it for owner review;
4. only archive/unpublish through an explicit owner-approved action.

Historical order items remain safe because orders already store product, SKU, pack size and price snapshots.

## Source-of-truth policy

After import:

- catalogue pages read Supabase;
- product details read Supabase;
- cart pricing reads Supabase;
- stock and availability read Supabase;
- admin edits write Supabase;
- FlashBillr downtime does not take the website offline.

## Migration

Draft migration:

```text
supabase/migrations/20260724070000_flashbillr_catalogue_import.sql
```

It creates:

- `catalogue_import_runs`;
- `catalogue_import_items`;
- `external_entity_mappings`;
- `product_import_controls`;
- indexes, RLS and admin-only policies.

Do not execute it in CapDent, Astro or another Supabase project.

## Remaining contract requirement

The exact FlashBillr products endpoint, authentication method and response JSON structure are still required before implementing the API adapter. Do not guess field names or endpoint paths in production.
