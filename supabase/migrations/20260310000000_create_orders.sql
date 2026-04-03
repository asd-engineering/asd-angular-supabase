create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mollie_payment_id text,
  amount numeric(10,2) not null,
  currency text default 'EUR',
  status text default 'pending',
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
