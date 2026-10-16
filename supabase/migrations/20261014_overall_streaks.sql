-- Overall streaks computed in Postgres (performance review P-H1)
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- Replaces fetching every task_logs row to the client, which silently hit the
-- 1000-row API cap and produced wrong streaks for active users.
--
-- A day counts toward the streak if any task was logged that day (partial days
-- count). The current streak is still alive if its last day is today or
-- yesterday, matching countStreak in src/lib/streaks.ts.
--
-- p_today is passed from the app so "today" follows the user's timezone.
-- No user id parameter: the function only ever reads the caller's own logs via
-- auth.uid(), and runs as the caller (security invoker) so RLS still applies.

create or replace function get_overall_streaks(p_today date)
returns table (current_streak int, longest_streak int)
language sql
stable
security invoker
set search_path = public
as $$
  with days as (
    select distinct date::date as d
    from task_logs
    where user_id = auth.uid()
  ),
  -- Consecutive dates minus their row number give the same value,
  -- so each unbroken run of days ends up in one group ("gaps and islands").
  runs as (
    select d, d - (row_number() over (order by d))::int as grp
    from days
  ),
  islands as (
    select max(d) as end_d, count(*)::int as len
    from runs
    group by grp
  )
  select
    coalesce(
      (select len from islands where end_d >= p_today - 1 order by end_d desc limit 1),
      0
    ) as current_streak,
    coalesce((select max(len) from islands), 0) as longest_streak;
$$;
