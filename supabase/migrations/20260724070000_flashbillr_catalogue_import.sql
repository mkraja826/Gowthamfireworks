-- GOWTHAM FIREWORKS INDUSTRIES
-- FlashBillr one-way catalogue import foundation
-- Draft only. Run after supabase/schema.sql in the dedicated Gowtham Fireworks project.
-- The public website must never query FlashBillr directly.

begin;

create table if not exists public.catalogue_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  external_store_id text not null,
  status text not null default 'running'
    check (status in ('running','validated','applied','partially_applied','failed','cancelled')),
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual','scheduled','webhook','retry')),
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  fetched_count integer not null default 0 check (fetched_count >= 0),
  valid_count integer not null default 0 check (valid_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  source_cursor text,
  error_summary text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.catalogue_import_items (
  id bigint generated always as identity primary key,
  import_run_id uuid not null references public.catalogue_import_runs(id) on delete cascade,
  entity_type text not null
    check (entity_type in ('category','brand','product','image','price','inventory')),
  external_id text not null,
  action text not null default 'pending'
    check (action in ('pending','insert','update','skip','archive','error')),
  internal_id uuid,
  source_updated_at timestamptz,
  payload_hash text,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (import_run_id, entity_type, external_id)
);

create table if not exists public.external_entity_mappings (
  source_system text not null,
  external_store_id text not null,
  entity_type text not null
    check (entity_type in ('category','brand','product','image','price','inventory')),
  external_id text not null,
  internal_id uuid not null,
  source_updated_at timestamptz,
  last_imported_at timestamptz not null default now(),
  payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  primary key (source_system, external_store_id, entity_type, external_id)
);

create table if not exists public.product_import_controls (
  product_id uuid primary key references public.products(id) on delete cascade,
  sync_name boolean not null default true,
  sync_description boolean not null default true,
  sync_category boolean not null default true,
  sync_brand boolean not null default true,
  sync_pack_size boolean not null default true,
  sync_retail_price boolean not null default true,
  sync_wholesale_price boolean not null default false,
  sync_stock boolean not null default true,
  sync_images boolean not null default true,
  sync_visibility boolean not null default false,
  last_seen_at timestamptz,
  missing_sync_count integer not null default 0 check (missing_sync_count >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists catalogue_import_runs_source_idx
  on public.catalogue_import_runs(source_system, external_store_id, started_at desc);

create index if not exists catalogue_import_items_run_action_idx
  on public.catalogue_import_items(import_run_id, action, entity_type);

create index if not exists external_entity_mappings_internal_idx
  on public.external_entity_mappings(entity_type, internal_id);

create trigger product_import_controls_updated_at
before update on public.product_import_controls
for each row execute function public.set_updated_at();

alter table public.catalogue_import_runs enable row level security;
alter table public.catalogue_import_items enable row level security;
alter table public.external_entity_mappings enable row level security;
alter table public.product_import_controls enable row level security;

create policy "Admins can read import runs"
on public.catalogue_import_runs for select
using (public.is_admin());

create policy "Admins can manage import runs"
on public.catalogue_import_runs for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read import items"
on public.catalogue_import_items for select
using (public.is_admin());

create policy "Admins can manage import items"
on public.catalogue_import_items for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read external mappings"
on public.external_entity_mappings for select
using (public.is_admin());

create policy "Admins can manage external mappings"
on public.external_entity_mappings for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read product import controls"
on public.product_import_controls for select
using (public.is_admin());

create policy "Admins can manage product import controls"
on public.product_import_controls for all
using (public.is_admin())
with check (public.is_admin());

comment on table public.catalogue_import_runs is
  'Audit record for each server-side external catalogue import.';
comment on table public.catalogue_import_items is
  'Raw and normalized staging rows. Import data is validated here before applying to catalogue tables.';
comment on table public.external_entity_mappings is
  'Stable mapping between external FlashBillr identifiers and internal Supabase rows.';
comment on table public.product_import_controls is
  'Per-product owner controls that prevent future imports from overwriting selected fields.';

commit;
