# FlashBillr staging success — 235 products

Date: 24 July 2026
Status: Successful staging; live apply pending.

## Confirmed local result

- Source file: `imports/flashbillr-products.json`
- Source records detected: 235
- Valid records: 235
- Invalid records: 0
- Staging report: `imports/reports/2026-07-24T12-27-58.018Z-stage.json` (local and gitignored)
- Supabase import run: `bd37839b-cc4e-4bc6-b672-34939f70fb46`
- Live catalogue products changed: none

## Database state reached

The dedicated Gowtham Fireworks Supabase project has now received:

1. `supabase/schema.sql`
2. `supabase/migrations/20260724070000_flashbillr_catalogue_import.sql`
3. One validated FlashBillr staging run containing 235 product rows.

## Safety status

- The public website still does not query FlashBillr directly.
- No imported product has been published.
- No live product, price or inventory row was created by staging.
- The apply operation remains protected by the exact confirmation phrase `APPLY_FLASHBILLR_TO_SUPABASE`.
- When apply is eventually run, new products are created as `status = draft` and `is_published = false` for owner review.

## Next verification

Before live apply, verify the Supabase staging run and item counts:

```sql
select
  r.id,
  r.status,
  r.fetched_count,
  r.valid_count,
  r.failed_count,
  r.started_at,
  r.completed_at,
  count(i.id) as staged_items,
  count(i.id) filter (where i.action = 'pending') as pending_items,
  count(i.id) filter (where i.action = 'error') as error_items
from public.catalogue_import_runs r
left join public.catalogue_import_items i on i.import_run_id = r.id
where r.id = 'bd37839b-cc4e-4bc6-b672-34939f70fb46'
group by r.id;
```

Expected: status `validated`, fetched/valid/staged/pending counts all 235, and failed/error counts 0.
