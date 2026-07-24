# FlashBillr importer implementation 001

Date: 24 July 2026
Status: Source implementation complete; local dry-run and real-data validation pending.

## Implemented

- Added `scripts/import-flashbillr.mjs`.
- Added dry-run, stage and apply npm commands.
- Added `.env.import.example` with the Gowtham Fireworks FlashBillr Store ID and API base URL.
- Added local import/report paths to `.gitignore`.
- Added `docs/FLASHBILLR_LOCAL_IMPORT_RUNBOOK.md`.

## Commands

```text
npm run import:flashbillr:dry -- --file imports/flashbillr-products.json
npm run import:flashbillr:stage -- --file imports/flashbillr-products.json
npm run import:flashbillr:apply -- --file imports/flashbillr-products.json --confirm APPLY_FLASHBILLR_TO_SUPABASE
```

## Safety guarantees

- Dry-run is the default.
- Dry-run does not require or contact Supabase.
- Staging writes only import audit/staging rows.
- Apply requires an explicit confirmation phrase.
- New products remain draft and unpublished.
- Stable external mappings prevent name-based duplicate matching.
- SKU matching is a secondary reconciliation path.
- Retail price history is preserved when prices change.
- Product import controls protect owner overrides.
- No product is automatically hard-deleted.
- Local JSON exports, reports and credentials are ignored by Git.
- Supabase secret keys are never browser variables.

## Version 1 field support

The normalizer recognises common aliases for:

- product ID, item ID, SKU, code and barcode;
- name/title;
- category and brand;
- description;
- pack size/unit/UOM;
- selling price and MRP;
- stock quantity;
- low-sound and green flags;
- image URLs;
- source update timestamp.

## Current limitations

- The exact FlashBillr product endpoint and response contract are still unconfirmed.
- Product-image files are not yet downloaded and copied to Supabase Storage.
- Version 1 applies products sequentially and records per-product failures; a database RPC transaction can be added after real response validation.
- The importer has not been executed against the owner's private Supabase project by ChatGPT.

## Next validation

1. Pull latest `main` locally.
2. Save one real FlashBillr product response to `imports/flashbillr-products.json`.
3. Run dry-run with `--limit 5`.
4. Review normalized names, IDs, categories, prices and stock.
5. Adjust aliases if FlashBillr uses different field names.
6. Run staging only after the preview is correct.
7. Apply only after reviewing Supabase staging rows.
