-- Subscriptions table for Stripe billing
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'none',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- Users can read their own subscription row.
create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies are defined for the authenticated role,
-- so all writes must go through the service role key (used only by the
-- Stripe webhook handler on the server). This prevents a user from ever
-- setting their own subscription_status to 'active' via the client.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row
  execute function set_updated_at();
