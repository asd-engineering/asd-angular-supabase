-- Subscriptions table for Mollie recurring billing
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mollie_customer_id text not null,
  mollie_subscription_id text,
  plan_name text not null,
  amount numeric(10,2) not null,
  currency text default 'EUR',
  interval text default '1 month',
  status text default 'pending',  -- pending, active, canceled, suspended
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can create own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Link orders to subscriptions for recurring payments
alter table public.orders add column subscription_id uuid references public.subscriptions(id);
