# Gowtham Fireworks — Pending Implementation Checklist

**Last updated:** 24 July 2026  
**Current verified progress:** 30%  
**Production website:** must remain unchanged until replacement acceptance  
**Staging:** `gowthamfireworks.karthikraja826.workers.dev`

This file consolidates all work that is still pending. Items must be completed, built, tested and accepted before they are marked complete. Imported FlashBillr products must remain `draft` and `is_published=false` until owner review is finished.

## 1. Immediate verification of the latest admin changes

- [ ] Pull the latest `main` branch.
- [ ] Run `npm run typecheck` successfully.
- [ ] Run `npm run build` successfully.
- [ ] Start the local application and complete owner OTP login.
- [ ] Confirm `/admin` opens only for `owner_admin` or `staff`.
- [ ] Confirm `/admin/products` loads all 235 imported products.
- [ ] Confirm every imported product is still draft and unpublished.
- [ ] Confirm product search works by name, SKU and category.
- [ ] Confirm a signed-out browser is redirected from `/admin` and `/admin/products` to `/admin/login`.
- [ ] Verify `PUBLIC_VISIBLE_PRODUCTS=0` using the public Supabase publishable key.
- [ ] Run `npm run cf:build` after local verification.
- [ ] Deploy only to the existing workers.dev staging Worker.
- [ ] Smoke-test protected admin access on staging.

## 2. Authentication and admin security

- [ ] Confirm the primary owner has an active `owner_admin` role.
- [ ] Add a visible admin logout action that clears the Supabase session.
- [ ] Keep admin login unlinked from the public customer navigation.
- [ ] Reject authenticated users who do not have `owner_admin` or `staff`.
- [ ] Confirm suspended or closed profiles cannot use protected workflows.
- [ ] Test the full RLS matrix for anonymous, retail customer, wholesale applicant, wholesaler, staff and owner-admin roles.
- [ ] Confirm anonymous users cannot read draft products, prices, inventory, import controls, mappings or private documents.
- [ ] Confirm retail users cannot read wholesale-only price lists, MOQs or carton quantities.
- [ ] Confirm wholesale applicants cannot see wholesale pricing before approval.
- [ ] Confirm only owner/staff can create, edit, archive, review or publish catalogue records.
- [ ] Add audit records for sensitive admin actions.
- [ ] Ensure no Supabase secret/service-role key is included in browser code or committed files.
- [ ] Choose and configure a production SMS provider only when production OTP is required.
- [ ] Complete India DLT/template/sender requirements before production SMS use.

## 3. Admin product review and catalogue management

- [ ] Add pagination or virtualized loading for the 235-product review queue.
- [ ] Add filters for draft, active, archived, published, unpublished, reviewed and missing-image products.
- [ ] Add filters for category, brand, stock state and data-quality problems.
- [ ] Add a product detail/edit page.
- [ ] Allow safe editing of product name, slug, SKU, description and pack size.
- [ ] Allow category and brand reassignment.
- [ ] Allow editing low-sound, green and featured flags.
- [ ] Allow retail price and MRP editing.
- [ ] Allow wholesale price-list, MOQ and carton-quantity editing without exposing them publicly.
- [ ] Allow stock quantity, reserved quantity and low-stock threshold editing.
- [ ] Allow retail and wholesale availability editing.
- [ ] Add a clear owner-review status for each imported product.
- [ ] Add validation for duplicate SKU, duplicate slug, invalid prices, negative stock and incomplete required data.
- [ ] Add explicit confirmation before publishing.
- [ ] Prevent publishing when required review, pricing or image checks have not passed.
- [ ] Add safe unpublish and archive actions.
- [ ] Add bulk review actions with confirmation and an audit trail.
- [ ] Do not add unrestricted bulk publishing.
- [ ] Add change history or before/after audit data for important catalogue edits.
- [ ] Improve multi-table product creation so product, price, inventory and channel settings cannot remain partially written after a failure.

## 4. Review of all 235 imported products

- [ ] Review every imported product name for spelling and formatting.
- [ ] Review product SKU values and duplicates.
- [ ] Review category mapping.
- [ ] Review brand mapping.
- [ ] Review descriptions and pack sizes.
- [ ] Review retail MRP and selling price.
- [ ] Review wholesale data separately.
- [ ] Review stock values and products imported with zero stock.
- [ ] Review retail visibility and availability.
- [ ] Identify products that should not appear on the new website.
- [ ] Select the first approved products for staging publication.
- [ ] Keep all unreviewed products draft/unpublished.
- [ ] Test a second FlashBillr import as an update, confirming stable mappings and no duplicate products.
- [ ] Confirm missing upstream products are never automatically hard-deleted.
- [ ] Add a controlled owner override for records that must not be overwritten by future imports.

## 5. Product images and Supabase Storage

- [ ] Collect or confirm approved product images from the owner.
- [ ] Copy approved images into the dedicated Supabase `product-images` bucket.
- [ ] Do not hotlink FlashBillr images from the public website.
- [ ] Compress and resize images before storage.
- [ ] Standardize image formats and maximum dimensions.
- [ ] Validate MIME type and file size before upload.
- [ ] Add primary-image and display-order controls.
- [ ] Add meaningful alt text.
- [ ] Add a safe placeholder for products without images.
- [ ] Prevent orphaned Storage objects when an upload or database insert fails.
- [ ] Prevent accidental deletion of an image still referenced by a product.
- [ ] Verify only admins can upload, replace or delete product images.
- [ ] Verify business documents remain private and owner-scoped.

## 6. Replace demo catalogue data with live Supabase data

- [ ] Keep `lib/demo-data.ts` active until security and owner review pass.
- [ ] Build server-side public catalogue queries from Supabase.
- [ ] Public queries must explicitly require `status='active'` and `is_published=true`.
- [ ] Join only public-safe category, brand, retail price, retail channel, stock and image data.
- [ ] Never expose wholesale prices or private application data through public queries.
- [ ] Replace the six demo product cards with approved database products.
- [ ] Replace demo product detail pages with live product detail queries.
- [ ] Add live category browsing.
- [ ] Add live search, filter and sort.
- [ ] Add pagination or load-more behavior.
- [ ] Add loading, empty, not-found and error states.
- [ ] Add safe fallback behavior when Supabase is temporarily unavailable.
- [ ] Verify draft products never appear in page HTML, metadata, search results or API responses.
- [ ] Update sitemap generation to include only active published products.

## 7. Customer authentication and profiles

- [ ] Complete production-ready phone OTP configuration.
- [ ] Preserve test OTP only for development/staging numbers.
- [ ] Add reliable session refresh and logout behavior.
- [ ] Verify first-login Personal/Business routing.
- [ ] Complete personal profile onboarding and editing.
- [ ] Complete customer address creation and editing.
- [ ] Prevent users from editing protected profile status or roles.
- [ ] Add clear handling for suspended and closed accounts.
- [ ] Test account recovery and phone-number change policy before production.

## 8. Wholesale application and approved business access

- [ ] Complete the business application form with all required legal/business fields.
- [ ] Upload business documents only to the private `business-documents` bucket.
- [ ] Display application status to the applicant.
- [ ] Build the real admin application-review screen.
- [ ] Allow owner/staff to approve, request correction, reject or suspend an application.
- [ ] Record reviewer notes and status history.
- [ ] Assign the correct wholesale price list after approval.
- [ ] Grant the `wholesaler` role only after approval.
- [ ] Remove or block wholesale access after suspension/rejection.
- [ ] Show wholesale price, MOQ and carton data only to approved wholesalers.
- [ ] Test document access so businesses see only their own files while admins can review them.

## 9. Cart, requirement submission and manual confirmation

- [ ] Replace local-only cart persistence with authenticated Supabase cart storage where required.
- [ ] Decide and implement anonymous-cart-to-account merging.
- [ ] Revalidate product status, visibility, price and availability on the server before submission.
- [ ] Create order/request snapshots so future catalogue edits do not alter submitted requirements.
- [ ] Support retail and approved-wholesale request submission.
- [ ] Generate a unique customer reference number.
- [ ] Add customer notes and delivery-address snapshot.
- [ ] Keep version one in `ENQUIRY_ONLY` / `MANUAL_CONFIRMATION` mode.
- [ ] Do not add a payment gateway to version one unless the product scope is explicitly changed.
- [ ] Generate a clear WhatsApp requirement summary without exposing internal data.
- [ ] Add success, duplicate-submit and failure handling.
- [ ] Add order/request status history.

## 10. Admin applications, requests and operations

- [ ] Replace the applications shell with real Supabase data.
- [ ] Replace the requests shell with real submitted requests.
- [ ] Add filters by retail/wholesale channel, status and date.
- [ ] Add customer/business details required for manual confirmation.
- [ ] Allow status updates with an audit trail.
- [ ] Add internal admin notes.
- [ ] Add stock-confirmation and quote workflow states.
- [ ] Add safe CSV/export capability only if required by the owner.
- [ ] Prevent staff actions outside their intended permissions.

## 11. Website content, settings and business configuration

- [ ] Add final logo and favicon.
- [ ] Add real factory and product photography.
- [ ] Replace staging/development wording and mock product artwork.
- [ ] Configure verified phone, WhatsApp and email contact details.
- [ ] Configure retail and wholesale minimum requirement values.
- [ ] Configure service states, cities and transport conditions.
- [ ] Configure commerce mode and manual-confirmation wording.
- [ ] Add owner-manageable public announcements and offers.
- [ ] Add owner-manageable homepage and contact content.
- [ ] Add store timings if required.
- [ ] Add final SEO title, description, canonical URLs and social-share metadata.
- [ ] Add `robots.txt` and production sitemap behavior.
- [ ] Add privacy-conscious analytics only after owner approval.

## 12. Legal, safety and commercial decisions

- [ ] Confirm company/legal business name and contact identity.
- [ ] Confirm fireworks licences and which licence details may be published.
- [ ] Obtain specialist review of fireworks sale, transport and fulfilment wording.
- [ ] Define service regions and locations where fulfilment is not offered.
- [ ] Add clear safety, storage and handling notices.
- [ ] Add age/eligibility wording where legally required.
- [ ] Define GST/tax display and invoice approach.
- [ ] Define retail and wholesale minimum values.
- [ ] Define cancellation, correction, return and refusal policies.
- [ ] Add Terms, Privacy Policy and business/wholesale verification terms.
- [ ] Clearly state that online submission is a requirement/enquiry until manually confirmed.
- [ ] Do not claim shipping or delivery capabilities that have not been legally and operationally confirmed.

## 13. UI, accessibility and device acceptance

- [ ] Test the complete public website on Android and iPhone screen sizes.
- [ ] Test admin pages on desktop, tablet and mobile.
- [ ] Test Chrome, Edge, Safari and Firefox.
- [ ] Complete keyboard navigation testing.
- [ ] Complete screen-reader/semantic-label testing.
- [ ] Verify color contrast and focus states.
- [ ] Verify forms show field-level errors and useful recovery guidance.
- [ ] Add loading and disabled states for every network action.
- [ ] Confirm the Grammarly/browser-extension hydration warning no longer blocks testing.
- [ ] Test reduced-motion behavior.
- [ ] Replace all temporary emojis/mock artwork with approved assets before production acceptance.

## 14. Testing, security, reliability and performance

- [ ] Add repeatable RLS/security verification scripts.
- [ ] Add unit tests for formatting, validation and catalogue rules.
- [ ] Add integration tests for auth, role checks, catalogue reads and admin writes.
- [ ] Add end-to-end tests for customer login, wholesale application, admin review and request submission.
- [ ] Test duplicate submissions and interrupted network operations.
- [ ] Test import partial-failure recovery.
- [ ] Test Storage upload failures and cleanup.
- [ ] Test database backup and restore procedure.
- [ ] Add secure HTTP headers and review Content Security Policy compatibility.
- [ ] Review caching so authenticated/admin data is never publicly cached.
- [ ] Optimize image loading, fonts and page bundles.
- [ ] Run Lighthouse/performance checks on key public pages.
- [ ] Review Cloudflare and Supabase logs without logging secrets or private documents.
- [ ] Add error monitoring appropriate to the final production environment.

## 15. Staging acceptance and production cutover

- [ ] Keep `gowthamfireworksindustries.com` on the existing production site until final acceptance.
- [ ] Configure all required public Cloudflare variables for the staging Worker.
- [ ] Rebuild after any `NEXT_PUBLIC_*` environment change.
- [ ] Complete staging smoke tests for public, customer, wholesale and admin flows.
- [ ] Complete owner acceptance of product data and imagery.
- [ ] Publish only a small reviewed set first on staging.
- [ ] Verify no draft or wholesale-only data is exposed.
- [ ] Prepare DNS/custom-domain cutover steps.
- [ ] Prepare a rollback plan to the existing production site.
- [ ] Connect the production domain only after written owner acceptance.
- [ ] Verify HTTPS, redirects, canonical URLs, sitemap and Search Console after cutover.
- [ ] Monitor authentication, errors, performance and submitted requirements after launch.

## 16. Explicitly outside version-one scope unless later approved

- Online payment gateway and automatic payment capture.
- Automatic order acceptance without factory confirmation.
- Public access to FlashBillr or direct browser queries to FlashBillr.
- Automatic hard deletion when a product disappears upstream.
- Public wholesale pricing for unapproved users.
- Unrestricted staff permissions or public admin registration.

## Current execution order

1. Build and verify the latest protected admin code locally.
2. Confirm the owner role and 235-product draft queue.
3. Confirm signed-out admin redirect and `PUBLIC_VISIBLE_PRODUCTS=0`.
4. Build and redeploy to workers.dev staging.
5. Finish product edit/review controls and review all 235 products.
6. Copy approved product images to Supabase Storage.
7. Replace demo catalogue data with public-safe Supabase queries.
8. Complete wholesale applications and request submission.
9. Finish legal content, testing, owner acceptance and production cutover.
