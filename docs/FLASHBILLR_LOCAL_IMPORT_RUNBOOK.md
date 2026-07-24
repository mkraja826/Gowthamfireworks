# FlashBillr catalogue import — local runbook

Date: 24 July 2026

This workflow copies FlashBillr product data into the dedicated Gowtham Fireworks Supabase project without exposing credentials to ChatGPT, GitHub, Cloudflare browser code, or the public website.

## Confirmed FlashBillr contract

Source reviewed: `Aathirajan/flashbillr_admin`.

- API base is supplied by the deployed backend URL.
- Axios adds `/api` to the backend base.
- Store-admin products endpoint: `GET /api/storeadmin/products`.
- Authentication: `Authorization: Bearer <JWT>`.
- The store is selected from the authenticated store-admin token, not from a public store-ID query parameter.
- Profile verification endpoint: `GET /api/auth/profile`.
- Product response wrapper: `{ products, pagination }`.
- Pagination fields: `page`, `limit`, `total`, `pages`.
- Product fields include `id`, `name`, `description`, `category`, `brand`, `sku`, `mrp`, `currentStock`, `contentType`, `sellingPrice`, `gstRate`, `youtubeUrl`, `images`, and `createdAt`.

The importer verifies that the JWT belongs to store `cmfmpccfc000do5hjfkyh4ene` before exporting products.

## Safety model

- FlashBillr is an upstream source only.
- The public website never calls FlashBillr.
- All export/import commands run locally on the owner's Windows computer.
- Product export and dry-run do not connect to Supabase.
- Staging writes raw records but does not modify live catalogue products.
- Apply requires `APPLY_FLASHBILLR_TO_SUPABASE`.
- New products are created as `draft`, `is_published = false`.
- Products are never automatically hard-deleted.
- JWTs and Supabase secret keys remain only in `.env.import.local`.
- Images are recorded in staging but are not copied into Supabase Storage by importer version 1.

## Prerequisites

1. Pull the latest `mkraja826/Gowthamfireworks` main branch.
2. Run `npm install`.
3. For staging/apply only, use the dedicated Gowtham Fireworks Supabase project.
4. Run `supabase/schema.sql` in that project.
5. Run `supabase/migrations/20260724070000_flashbillr_catalogue_import.sql` after the main schema.

## Step 1 — update the local repo

```powershell
Set-Location C:\Gowthamfireworks
git pull origin main
npm install
Copy-Item .env.import.example .env.import.local -Force
```

`.env.import.local` is ignored by Git.

## Step 2 — obtain a current FlashBillr store-admin JWT

1. Log in to the working FlashBillr Admin dashboard as the Gowtham Fireworks store admin.
2. Press `F12`.
3. Open the **Console** tab.
4. Run:

```javascript
copy(localStorage.getItem('token'))
```

5. Open `.env.import.local`:

```powershell
notepad .env.import.local
```

6. Paste the token after:

```env
FLASHBILLR_API_TOKEN=
```

Do not add quotes unless the token itself requires them. Never commit or share this file.

## Step 3 — export all FlashBillr products locally

Run:

```powershell
npm run fetch:flashbillr-products
```

The exporter will:

1. call `/api/auth/profile`;
2. verify the role is store admin;
3. verify the token's store ID equals `cmfmpccfc000do5hjfkyh4ene`;
4. request `/api/storeadmin/products` page by page;
5. combine all pages;
6. save the response to:

```text
imports/flashbillr-products.json
```

Expected final output resembles:

```text
Verified store: <store name> (cmfmpccfc000do5hjfkyh4ene)
Fetching products page 1...
Exported <count> products.
Saved: C:\Gowthamfireworks\imports\flashbillr-products.json
No Supabase connection was made.
```

## Step 4 — dry-run five products

```powershell
npm run import:flashbillr:dry -- `
  --file imports/flashbillr-products.json `
  --limit 5
```

Dry-run:

- detects the `products` array;
- normalizes source fields;
- validates external ID, name, selling price, MRP and stock;
- prints a preview table;
- writes a report under `imports/reports/`;
- does not connect to Supabase.

Review names, SKUs, categories, selling prices, MRP and stock before continuing.

## Step 5 — dry-run the full export

```powershell
npm run import:flashbillr:dry -- `
  --file imports/flashbillr-products.json
```

Do not stage data while validation failures remain unexplained.

## Step 6 — stage raw records in Supabase

Only after the main schema and import migration have been applied:

```powershell
npm run import:flashbillr:stage -- `
  --file imports/flashbillr-products.json
```

This creates:

- one `catalogue_import_runs` record;
- one raw `catalogue_import_items` record per product;
- normalized values and validation errors.

It does not create or update live catalogue products.

Review:

```sql
select *
from public.catalogue_import_runs
order by started_at desc
limit 5;
```

```sql
select external_id, action, normalized_payload, validation_errors
from public.catalogue_import_items
where entity_type = 'product'
order by id
limit 50;
```

## Step 7 — apply validated records as hidden drafts

Only after reviewing staging:

```powershell
npm run import:flashbillr:apply -- `
  --file imports/flashbillr-products.json `
  --confirm APPLY_FLASHBILLR_TO_SUPABASE
```

The importer applies:

1. categories;
2. brands;
3. products;
4. external mappings;
5. product import controls;
6. retail channel settings;
7. inventory;
8. retail price history.

Imported products remain unpublished until reviewed by the owner.

## Token expiry

When export returns `401` or `403`:

1. log in to FlashBillr Admin again;
2. run `copy(localStorage.getItem('token'))` again;
3. replace `FLASHBILLR_API_TOKEN` in `.env.import.local`;
4. rerun the export command.

## Tenant mismatch protection

If the JWT belongs to another store, export stops before writing a JSON file. Do not disable verification except during controlled debugging.

```env
FLASHBILLR_VERIFY_STORE=true
```

## Images

The product response contains image URLs. Version 1 stores them in raw/normalized staging and mapping metadata. A later phase will download, validate, compress and copy them into Supabase Storage so the website never depends permanently on FlashBillr image URLs.
