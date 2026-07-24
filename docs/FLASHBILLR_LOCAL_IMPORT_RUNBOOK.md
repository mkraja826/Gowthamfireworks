# FlashBillr catalogue import — local runbook

Date: 24 July 2026

This workflow imports FlashBillr product data into the dedicated Gowtham Fireworks Supabase project without exposing Supabase credentials to ChatGPT, GitHub, Cloudflare browser code, or the public website.

## Safety model

- FlashBillr is an upstream source only.
- The public website never calls FlashBillr.
- All imports run locally from the owner's Windows computer.
- Dry-run is the default.
- Staging writes raw records but does not change live catalogue products.
- Apply requires the exact confirmation phrase `APPLY_FLASHBILLR_TO_SUPABASE`.
- New imported products are always `draft` and `is_published = false`.
- Products are never automatically hard-deleted.
- Product images are recorded in normalized staging data but are not copied to Supabase Storage by importer version 1.

## Prerequisites

1. Clone or pull `mkraja826/Gowthamfireworks` locally.
2. Use the dedicated Gowtham Fireworks Supabase project only.
3. Run `supabase/schema.sql` in that project.
4. Run `supabase/migrations/20260724070000_flashbillr_catalogue_import.sql` after the main schema.
5. Install dependencies with `npm install`.

## Local environment

Copy the template:

```powershell
Copy-Item .env.import.example .env.import.local
```

Edit `.env.import.local` and provide only on your own computer:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_PRIVATE_SERVER_KEY

FLASHBILLR_STORE_ID=cmfmpccfc000do5hjfkyh4ene
FLASHBILLR_API_URL=https://flashbillr-mumbai-562462089707.asia-south1.run.app
```

Never commit `.env.import.local`.

## Recommended first import: JSON-file mode

Because the exact FlashBillr product endpoint and response contract are not yet confirmed, first export the working product response from the existing FlashBillr storefront.

1. Open the storefront in Chrome.
2. Press F12 and open Network.
3. Filter Fetch/XHR.
4. Reload the page.
5. Open the request that returns products.
6. Save the response as:

```text
imports/flashbillr-products.json
```

The `imports/*.json` path is ignored by Git.

## Step 1 — dry-run

```powershell
npm run import:flashbillr:dry -- --file imports/flashbillr-products.json
```

Dry-run:

- detects the product array;
- normalizes common field names;
- validates external ID, name, price, MRP and stock;
- prints a preview table;
- writes a local report in `imports/reports/`;
- does not connect to Supabase.

Use `--limit 5` for an initial sample:

```powershell
npm run import:flashbillr:dry -- --file imports/flashbillr-products.json --limit 5
```

## Step 2 — staging import

After the dry-run looks correct:

```powershell
npm run import:flashbillr:stage -- --file imports/flashbillr-products.json
```

This creates:

- one row in `catalogue_import_runs`;
- one raw staging row per product in `catalogue_import_items`;
- validation errors for invalid records.

It does not create or update live catalogue products.

Review in Supabase SQL Editor:

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
limit 20;
```

## Step 3 — apply to live catalogue as drafts

Only after reviewing staging:

```powershell
npm run import:flashbillr:apply -- `
  --file imports/flashbillr-products.json `
  --confirm APPLY_FLASHBILLR_TO_SUPABASE
```

The importer applies valid products in this order:

1. category;
2. brand;
3. product;
4. external mapping;
5. product import controls;
6. retail channel settings;
7. inventory;
8. retail price history.

Imported products remain unpublished drafts for owner review.

## API mode after the endpoint is known

The importer also supports direct server-side fetching. Configure either a full URL:

```env
FLASHBILLR_PRODUCTS_URL=https://example/products?storeId={storeId}
```

or base URL plus path:

```env
FLASHBILLR_PRODUCTS_PATH=/api/stores/{storeId}/products
```

Optional API configuration:

```env
FLASHBILLR_STORE_ID_QUERY_PARAM=storeId
FLASHBILLR_STORE_ID_HEADER=x-store-id
FLASHBILLR_API_TOKEN=
FLASHBILLR_AUTH_HEADER=Authorization
FLASHBILLR_HEADERS_JSON={"x-client":"gowtham-fireworks"}
```

Then run the same dry/stage/apply commands without `--file`.

## Supported common source fields

The version 1 normalizer checks common aliases for:

- external ID: `id`, `productId`, `itemId`, `sku`, `code`, `barcode`;
- name: `name`, `productName`, `itemName`, `title`;
- category and brand objects or names;
- pack size, unit or UOM;
- retail/selling/sale price;
- MRP/list/original price;
- stock/quantity/available quantity;
- product image URLs;
- updated timestamps.

The real FlashBillr response must still be reviewed before treating the mapping as production-final.

## Imported table behavior

- Stable FlashBillr IDs are saved in `external_entity_mappings`.
- Existing products are matched by mapping first and SKU second.
- Owner override flags in `product_import_controls` prevent future imports from overwriting selected fields.
- Retail price history is preserved: the current price is closed and a new effective price is inserted only when values change.
- Stock may update when `sync_stock` is enabled.
- Publication is never enabled automatically.

## Troubleshooting

### Could not find an array of product objects

The saved JSON may contain an unexpected wrapper. Inspect the file and locate the product array path. The importer searches common wrappers such as `products`, `items`, `data`, `results`, `result`, `catalogue`, and `inventory` up to four levels deep.

### Missing stable external ID

The product needs an `id`, product/item ID, SKU, code, or barcode. Do not apply records that cannot be mapped reliably across future imports.

### Supabase table not found

Run both SQL files in the correct order and only in the dedicated Gowtham Fireworks project.

### Apply blocked

This is intentional. Include:

```text
--confirm APPLY_FLASHBILLR_TO_SUPABASE
```

### Images do not appear

Importer version 1 does not copy remote images to Supabase Storage. Image download, validation, compression, and Storage upload are a separate safe phase after the real response structure is confirmed.
