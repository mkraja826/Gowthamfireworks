# FlashBillr export failure 002 — login wrapper compatibility and stale empty JSON

Date: 24 July 2026
Status: Exporter fix committed; owner retry pending.

## Observed local output

1. First direct login attempt returned HTTP 401. The exporter rendered the structured backend error as `[object Object]`, which was not diagnostic.
2. A later attempt returned HTTP success but the exporter could not find a top-level `token` property.
3. The previously created `imports/flashbillr-products.json` was empty, so the dry-run failed with `Unexpected end of JSON input`.

## Diagnosis

- The public FlashBillr admin frontend types expect `{ token, user }`, but the deployed backend response can use a different wrapper or token field.
- The importer failure did not indicate a Supabase problem. It attempted to parse a stale/empty local export file that had never been populated by a successful export.

## Fix

Commit: `b98ce51a9a360e6fa493b45aa21ce955cf8a636a`

Updated `scripts/fetch-flashbillr-products.mjs` to:

- accept token aliases including `token`, `accessToken`, `access_token`, `jwt`, `authToken`, and common nested `data`, `result`, `payload`, `response`, and `tokens` wrappers;
- accept nested user/profile wrappers;
- redact token/password/secret/authorization fields from diagnostics;
- serialize structured login errors instead of printing `[object Object]`;
- print response field names, not secret values, when a successful response uses an unsupported structure;
- support common nested product and pagination wrappers.

The updated script passed `node --check` before commit.

## Safe retry

1. Pull main.
2. Delete the stale local JSON export.
3. Keep `FLASHBILLR_API_TOKEN=` blank and retain the local store-admin email/password.
4. Run `npm run fetch:flashbillr-products`.
5. Do not run the importer until the exporter reports a positive product count and saves a valid JSON file.

No Supabase connection or database write occurred during this failure.
