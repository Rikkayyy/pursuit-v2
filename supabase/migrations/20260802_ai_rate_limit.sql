-- Daily rate limit for AI goal generation
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists ai_generation_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  count int not null default 0,
  primary key (user_id, date)
);

alter table ai_generation_limits enable row level security;

-- No policies are defined for the authenticated role — this table is written
-- to exclusively via the service role client inside the generate-goal API
-- route, using the function below. This prevents a user from resetting or
-- reading their own counter directly through the Supabase client, which
-- would let them bypass the rate limit entirely.

create or replace function increment_ai_generation_count(p_user_id uuid, p_date date)
returns int as $$
  insert into ai_generation_limits (user_id, date, count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set count = ai_generation_limits.count + 1
  returning count;
$$ language sql;
