-- A flexible task ("N times anytime during the week") earns one streak week for
-- every Sun–Sat week in which it was logged at least times_per_week times.
-- The streak is the number of such weeks in a row, ending this week or last week:
--   - this week's target already met  → this week counts, plus the run before it
--   - not met yet                     → this week is still in progress, so it
--                                       neither counts nor breaks the streak
-- Each week is judged by the task's *current* times_per_week (no target history).
--
-- Returns one row per flexible task in p_task_ids (streak 0 if none).
-- p_today is passed from the app so "this week" follows the user's timezone.
-- Runs as the caller (security invoker), so RLS on tasks and task_logs still
-- applies: a user can only get streaks for their own tasks.
-- Uses the existing unique (task_id, date) index on task_logs.

create or replace function get_flexible_streaks(p_task_ids uuid[], p_today date)
returns table (task_id uuid, streak int)
language sql
stable
security invoker
set search_path = public
as $$
  with flex as (
    select t.id, coalesce(t.times_per_week, 1) as target
    from tasks t
    where t.id = any(p_task_ids)
      and t.frequency = 'flexible'
  ),
  -- Weeks (keyed by their Sunday) in which each task reached its target.
  met_weeks as (
    select l.task_id,
           l.date::date - extract(dow from l.date::date)::int as week_start
    from task_logs l
    join flex f on f.id = l.task_id
    group by l.task_id, week_start, f.target
    having count(*) >= f.target
  ),
  -- Consecutive weeks minus 7 × their row number give the same value,
  -- so each unbroken run of weeks ends up in one group ("gaps and islands").
  islands as (
    select r.task_id, max(r.week_start) as end_week, count(*)::int as len
    from (
      select task_id,
             week_start,
             week_start - (7 * row_number() over (partition by task_id order by week_start))::int as grp
      from met_weeks
    ) r
    group by r.task_id, r.grp
  )
  select f.id as task_id,
         coalesce(
           (select i.len
            from islands i
            -- the run must end this week or last week to still be alive
            where i.task_id = f.id
              and i.end_week >= (p_today - extract(dow from p_today)::int) - 7
            order by i.end_week desc
            limit 1),
           0
         ) as streak
  from flex f;
$$;
