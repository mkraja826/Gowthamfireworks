# Supabase setup

`schema.sql` is the version-one database and RLS foundation for the dedicated Gowtham Fireworks project.

## Do not run it in another project

It must never be applied to CapDent, Astro or any unrelated Supabase project.

## Planned execution sequence

1. Review the frontend and database names.
2. Create/open the dedicated Gowtham Fireworks Supabase project.
3. Open SQL Editor and run `schema.sql` once.
4. Add Project URL and Publishable Key to `.env.local`.
5. Configure safe Supabase Test OTP phone numbers.
6. Log in once using the intended owner test number.
7. Run the commented owner bootstrap SQL at the bottom of `schema.sql`.
8. Test public, personal, business and owner access separately.

## Security

- Never put a service-role key in browser code.
- Product images use the public `product-images` bucket.
- Business documents use the private `business-documents` bucket.
- Wholesale pricing is protected by database policies and assigned price lists.
- Normal users cannot grant themselves admin or wholesaler roles.
