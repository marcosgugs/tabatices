create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  whatsapp text not null default '' check (whatsapp ~ '^([0-9]{10,11})?$'),
  address jsonb check (address is null or jsonb_typeof(address) = 'object'),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,20}$'),
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'awaiting_payment' check (
    status in ('awaiting_payment', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'canceled')
  ),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);

alter table public.customers enable row level security;
alter table public.orders enable row level security;

revoke all on public.customers, public.orders from anon;
grant select, insert, update, delete on public.customers, public.orders to authenticated;

create policy "Membros do painel gerenciam clientes"
  on public.customers
  for all
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'panel_member') = 'true')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'panel_member') = 'true');

create policy "Membros do painel gerenciam pedidos"
  on public.orders
  for all
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'panel_member') = 'true')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'panel_member') = 'true');
