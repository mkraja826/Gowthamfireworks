# FlashBillr guarded draft apply — success

Date: 24 July 2026

## Confirmed result

The dedicated Gowtham Fireworks Supabase project completed the guarded FlashBillr catalogue apply successfully.

- Apply run ID: `ea872062-2595-4f87-a670-6f50b8bb377b`
- Status: `applied`
- Fetched: 235
- Valid: 235
- Inserted: 235
- Updated: 0
- Failed: 0
- Staged item actions: 235 `insert`, 0 `update`, 0 `pending`, 0 `error`
- Completed at: `2026-07-24 12:46:15.978+00`

The earlier product count of 95 was observed while the per-record apply was still in progress. It was not a partial failure. The final database-side run verification confirms all 235 records were applied.

## Safety state

- Imported products were created as `draft`.
- Imported products were created with `is_published = false`.
- The public website still uses demo catalogue data and therefore has not been switched to these records.
- Product images have not yet been copied to Supabase Storage.
- No production-domain switch was performed.

## Next verification

Verify the final counts for products, external mappings, import controls, retail prices, inventory, and retail channel settings before wiring the frontend to Supabase.
