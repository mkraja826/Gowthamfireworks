-- GOWTHAM FIREWORKS INDUSTRIES
-- Initial application schema and Row Level Security foundation
-- Run only in the dedicated Gowtham Fireworks Supabase project.
-- Review the commented owner bootstrap section at the end before production use.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- IDENTITY AND ACCESS
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  email text,
  account_type text check (account_type in ('personal', 'business')),
  city text,
  state text,
  preferred_language text not null default 'English',
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('retail_customer', 'wholesale_applicant', 'wholesaler', 'staff', 'owner_admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.admin_allowlist (
  phone text primary key,
  intended_role text not null default 'owner_admin' check (intended_role in ('staff', 'owner_admin')),
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do update set phone = excluded.phone;

  if new.phone is not null and exists (
    select 1 from public.admin_allowlist
    where phone = new.phone and is_active = true
  ) then
    insert into public.user_roles (user_id, role)
    select new.id, intended_role from public.admin_allowlist
    where phone = new.phone and is_active = true
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of phone on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('owner_admin') or public.has_role('staff');
$$;

create or replace function public.complete_personal_onboarding(
  p_full_name text,
  p_email text,
  p_city text,
  p_state text,
  p_language text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if trim(coalesce(p_full_name, '')) = '' then raise exception 'Full name is required'; end if;

  update public.profiles
  set full_name = trim(p_full_name),
      email = nullif(trim(coalesce(p_email, '')), ''),
      account_type = 'personal',
      city = trim(p_city),
      state = trim(p_state),
      preferred_language = coalesce(nullif(trim(p_language), ''), 'English'),
      onboarding_completed = true,
      status = 'active',
      updated_at = now()
  where id = auth.uid();

  delete from public.user_roles
  where user_id = auth.uid() and role in ('wholesale_applicant', 'wholesaler');

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'retail_customer')
  on conflict do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- PERSONAL AND BUSINESS ACCOUNTS
-- -----------------------------------------------------------------------------

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  contact_person text not null,
  email text,
  business_type text not null,
  gstin text,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  licence_number text,
  licence_expiry date,
  expected_volume text,
  approval_status text not null default 'pending_review' check (approval_status in ('draft','pending_review','correction_required','approved','rejected','suspended','expired')),
  assigned_price_list_id uuid,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wholesale_applications (
  id uuid primary key default gen_random_uuid(),
  business_account_id uuid not null unique references public.business_accounts(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending_review' check (status in ('draft','pending_review','correction_required','approved','rejected','suspended','expired')),
  declarations jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wholesale_documents (
  id uuid primary key default gen_random_uuid(),
  business_account_id uuid not null references public.business_accounts(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  original_filename text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.complete_business_onboarding(
  p_business_name text,
  p_contact_person text,
  p_email text,
  p_business_type text,
  p_gstin text,
  p_address text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_licence_number text,
  p_expected_volume text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  account_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if trim(coalesce(p_business_name, '')) = '' then raise exception 'Business name is required'; end if;

  update public.profiles
  set full_name = trim(p_contact_person),
      email = nullif(trim(coalesce(p_email, '')), ''),
      account_type = 'business',
      city = trim(p_city),
      state = trim(p_state),
      onboarding_completed = true,
      status = 'active',
      updated_at = now()
  where id = auth.uid();

  insert into public.business_accounts (
    owner_user_id, business_name, contact_person, email, business_type, gstin,
    address, city, state, postal_code, licence_number, expected_volume, approval_status
  ) values (
    auth.uid(), trim(p_business_name), trim(p_contact_person), nullif(trim(coalesce(p_email, '')), ''),
    trim(p_business_type), nullif(trim(coalesce(p_gstin, '')), ''), trim(p_address), trim(p_city),
    trim(p_state), trim(p_postal_code), nullif(trim(coalesce(p_licence_number, '')), ''),
    nullif(trim(coalesce(p_expected_volume, '')), ''), 'pending_review'
  )
  on conflict (owner_user_id) do update set
    business_name = excluded.business_name,
    contact_person = excluded.contact_person,
    email = excluded.email,
    business_type = excluded.business_type,
    gstin = excluded.gstin,
    address = excluded.address,
    city = excluded.city,
    state = excluded.state,
    postal_code = excluded.postal_code,
    licence_number = excluded.licence_number,
    expected_volume = excluded.expected_volume,
    approval_status = 'pending_review',
    updated_at = now()
  returning id into account_id;

  insert into public.wholesale_applications (business_account_id, submitted_by, status)
  values (account_id, auth.uid(), 'pending_review')
  on conflict (business_account_id) do update set
    status = 'pending_review', submitted_at = now(), updated_at = now();

  delete from public.user_roles where user_id = auth.uid() and role = 'wholesaler';
  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'wholesale_applicant')
  on conflict do nothing;

  return account_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- CATALOGUE, PRICING AND INVENTORY
-- -----------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel text not null check (channel in ('retail','wholesale')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.business_accounts
  drop constraint if exists business_accounts_assigned_price_list_id_fkey;
alter table public.business_accounts
  add constraint business_accounts_assigned_price_list_id_fkey
  foreign key (assigned_price_list_id) references public.price_lists(id) on delete set null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  pack_size text,
  sku text unique,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  is_low_sound boolean not null default false,
  is_green boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text text,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_channel_settings (
  product_id uuid not null references public.products(id) on delete cascade,
  channel text not null check (channel in ('retail','wholesale')),
  is_visible boolean not null default true,
  availability text not null default 'available' check (availability in ('available','limited','out_of_stock','coming_soon','hidden')),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  carton_quantity integer check (carton_quantity is null or carton_quantity > 0),
  primary key (product_id, channel)
);

create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  selling_price numeric(12,2) not null check (selling_price >= 0),
  mrp numeric(12,2) check (mrp is null or mrp >= selling_price),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  unique (product_id, price_list_id, effective_from)
);

create table if not exists public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  check (reserved_quantity <= stock_quantity)
);

-- -----------------------------------------------------------------------------
-- CARTS, REQUESTS AND SNAPSHOTS
-- -----------------------------------------------------------------------------

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('retail','wholesale')),
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, channel, status)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default ('GFI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete restrict,
  business_account_id uuid references public.business_accounts(id) on delete restrict,
  channel text not null check (channel in ('retail','wholesale')),
  status text not null default 'submitted' check (status in ('draft','submitted','compliance_review','awaiting_stock_confirmation','quote_sent','customer_accepted','confirmed','processing','packed','dispatched','delivered','rejected','cancelled')),
  estimated_total numeric(14,2) not null default 0,
  confirmed_total numeric(14,2),
  address_snapshot jsonb not null default '{}'::jsonb,
  customer_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  pack_size_snapshot text,
  unit_price_snapshot numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(14,2) generated always as (unit_price_snapshot * quantity) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- CONTENT, OFFERS AND OPERATIONS
-- -----------------------------------------------------------------------------

create table if not exists public.delivery_regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  city text,
  channel text not null default 'both' check (channel in ('retail','wholesale','both')),
  is_active boolean not null default true,
  conditions text,
  display_order integer not null default 0
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  channel text not null default 'both' check (channel in ('retail','wholesale','both')),
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- INDEXES AND UPDATED-AT TRIGGERS
-- -----------------------------------------------------------------------------

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_published_idx on public.products(is_published, status);
create index if not exists product_prices_lookup_idx on public.product_prices(product_id, price_list_id, effective_from desc);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_channel_status_idx on public.orders(channel, status, created_at desc);
create index if not exists business_status_idx on public.business_accounts(approval_status, created_at desc);
create index if not exists applications_status_idx on public.wholesale_applications(status, submitted_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger addresses_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger business_accounts_updated_at before update on public.business_accounts for each row execute function public.set_updated_at();
create trigger wholesale_applications_updated_at before update on public.wholesale_applications for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();
create trigger carts_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger offers_updated_at before update on public.offers for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.auth_audit_events enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.business_accounts enable row level security;
alter table public.wholesale_applications enable row level security;
alter table public.wholesale_documents enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.price_lists enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_channel_settings enable row level security;
alter table public.product_prices enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.delivery_regions enable row level security;
alter table public.site_settings enable row level security;
alter table public.offers enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "roles own read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "roles admin manage" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "allowlist admin only" on public.admin_allowlist for all to authenticated using (public.has_role('owner_admin')) with check (public.has_role('owner_admin'));
create policy "auth audit admin read" on public.auth_audit_events for select to authenticated using (public.is_admin());

create policy "addresses own manage" on public.customer_addresses for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "business own read" on public.business_accounts for select to authenticated using (owner_user_id = auth.uid() or public.is_admin());
create policy "business admin update" on public.business_accounts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "applications own read" on public.wholesale_applications for select to authenticated using (submitted_by = auth.uid() or public.is_admin());
create policy "applications admin manage" on public.wholesale_applications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "documents own or admin read" on public.wholesale_documents for select to authenticated using (
  public.is_admin() or exists (select 1 from public.business_accounts b where b.id = business_account_id and b.owner_user_id = auth.uid())
);
create policy "documents own insert" on public.wholesale_documents for insert to authenticated with check (
  uploaded_by = auth.uid() and exists (select 1 from public.business_accounts b where b.id = business_account_id and b.owner_user_id = auth.uid())
);
create policy "documents admin manage" on public.wholesale_documents for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "categories public read" on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy "categories admin manage" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "brands public read" on public.brands for select to anon, authenticated using (is_active or public.is_admin());
create policy "brands admin manage" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "price lists authorised read" on public.price_lists for select to authenticated using (public.is_admin() or channel = 'retail' or public.has_role('wholesaler'));
create policy "price lists admin manage" on public.price_lists for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products public published read" on public.products for select to anon, authenticated using ((is_published and status = 'active') or public.is_admin());
create policy "products admin manage" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product images public read" on public.product_images for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.is_published and p.status = 'active') or public.is_admin()
);
create policy "product images admin manage" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "retail channel public read" on public.product_channel_settings for select to anon, authenticated using (
  (channel = 'retail' and is_visible and availability <> 'hidden') or
  (channel = 'wholesale' and is_visible and public.has_role('wholesaler')) or public.is_admin()
);
create policy "channel settings admin manage" on public.product_channel_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "retail and assigned prices read" on public.product_prices for select to anon, authenticated using (
  exists (select 1 from public.price_lists pl where pl.id = price_list_id and pl.channel = 'retail')
  or (
    auth.uid() is not null and exists (
      select 1 from public.business_accounts b
      where b.owner_user_id = auth.uid() and b.approval_status = 'approved' and b.assigned_price_list_id = price_list_id
    )
  )
  or public.is_admin()
);
create policy "product prices admin manage" on public.product_prices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "inventory admin only" on public.inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "carts own manage" on public.carts for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "cart items own manage" on public.cart_items for all to authenticated using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_admin()))
) with check (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_admin()))
);
create policy "orders own read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "orders own insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "order items own read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order items own insert" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid() and o.status in ('draft','submitted'))
);
create policy "order history own read" on public.order_status_history for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order history admin insert" on public.order_status_history for insert to authenticated with check (public.is_admin());

create policy "regions public read" on public.delivery_regions for select to anon, authenticated using (is_active or public.is_admin());
create policy "regions admin manage" on public.delivery_regions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public settings read" on public.site_settings for select to anon, authenticated using (key in ('public_content','contact','commerce_mode','minimum_values','seo') or public.is_admin());
create policy "settings admin manage" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "active offers public read" on public.offers for select to anon, authenticated using (
  (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_admin()
);
create policy "offers admin manage" on public.offers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit admin read" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "audit admin insert" on public.audit_logs for insert to authenticated with check (public.is_admin());

-- Restrict profile fields that users may update directly. Onboarding functions are SECURITY DEFINER.
revoke update on public.profiles from authenticated;
grant update (full_name, email, city, state, preferred_language) on public.profiles to authenticated;

revoke all on function public.complete_personal_onboarding(text,text,text,text,text) from public;
grant execute on function public.complete_personal_onboarding(text,text,text,text,text) to authenticated;
revoke all on function public.complete_business_onboarding(text,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.complete_business_onboarding(text,text,text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.has_role(text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- STORAGE BUCKETS AND POLICIES
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-documents', 'business-documents', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public product image read" on storage.objects for select to public using (bucket_id = 'product-images');
create policy "admin product image insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin product image update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin product image delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

create policy "business documents own read" on storage.objects for select to authenticated using (
  bucket_id = 'business-documents' and (
    public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text
  )
);
create policy "business documents own insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'business-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "business documents own update" on storage.objects for update to authenticated using (
  bucket_id = 'business-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
) with check (
  bucket_id = 'business-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "business documents own delete" on storage.objects for delete to authenticated using (
  bucket_id = 'business-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- -----------------------------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------------------------

insert into public.price_lists (code, name, channel)
values
  ('RETAIL', 'Retail', 'retail'),
  ('WHOLESALE_STANDARD', 'Wholesale Standard', 'wholesale'),
  ('WHOLESALE_SILVER', 'Wholesale Silver', 'wholesale'),
  ('WHOLESALE_GOLD', 'Wholesale Gold', 'wholesale')
on conflict (code) do nothing;

insert into public.categories (name, slug, display_order)
values
  ('Sparklers', 'sparklers', 10),
  ('Flower Pots', 'flower-pots', 20),
  ('Ground Chakkars', 'ground-chakkars', 30),
  ('Rockets', 'rockets', 40),
  ('Twinkling Stars', 'twinkling-stars', 50),
  ('Aerial Shots', 'aerial-shots', 60),
  ('Sound Crackers', 'sound-crackers', 70),
  ('Fancy Fountains', 'fancy-fountains', 80),
  ('Gift Boxes', 'gift-boxes', 90),
  ('Family Combos', 'family-combos', 100)
on conflict (slug) do nothing;

insert into public.site_settings (key, value)
values
  ('commerce_mode', '{"mode":"ENQUIRY_ONLY","manual_confirmation":true}'::jsonb),
  ('public_content', '{"hero_title":"Factory-direct fireworks for every scale of celebration","announcement":"Final availability and fulfilment are confirmed directly by the factory."}'::jsonb),
  ('contact', '{"phone":"","whatsapp":"","email":""}'::jsonb),
  ('minimum_values', '{"retail":null,"wholesale":null}'::jsonb),
  ('seo', '{"title":"Gowtham Fireworks Industries","description":"Factory-direct retail and wholesale fireworks catalogue and requirement portal."}'::jsonb)
on conflict (key) do nothing;

commit;

-- -----------------------------------------------------------------------------
-- OWNER ADMIN BOOTSTRAP (RUN MANUALLY AFTER TEST OTP USER EXISTS)
-- -----------------------------------------------------------------------------
-- 1. Configure a Supabase Test OTP phone number in Authentication settings.
-- 2. Log in once through /admin/login so auth.users and profiles contain the user.
-- 3. Replace the example phone below with the verified E.164 owner phone.
-- 4. Run these statements in the SQL editor:
--
-- insert into public.admin_allowlist (phone, intended_role, note)
-- values ('+919999999999', 'owner_admin', 'Primary owner')
-- on conflict (phone) do update set intended_role = excluded.intended_role, is_active = true;
--
-- insert into public.user_roles (user_id, role)
-- select id, 'owner_admin' from auth.users where phone = '+919999999999'
-- on conflict do nothing;
--
-- Never expose this admin assignment in the public user interface.
