-- Onboarding funnel: signup -> first goal -> first task -> first completed task
-- Run in the Supabase SQL Editor (needs access to auth.users).
-- Measures conversion using data already stored — no analytics SDK required.

with signups as (
  select id as user_id, created_at as signed_up_at
  from auth.users
),
first_goal as (
  select user_id, min(created_at) as first_goal_at
  from goals
  group by user_id
),
first_task as (
  select g.user_id, min(t.created_at) as first_task_at
  from tasks t
  join goals g on g.id = t.goal_id
  group by g.user_id
),
first_completion as (
  select user_id, min(completed_at) as first_completion_at
  from task_logs
  group by user_id
)
select
  s.user_id,
  s.signed_up_at,
  fg.first_goal_at,
  ft.first_task_at,
  fc.first_completion_at,
  (fg.first_goal_at is not null) as created_goal,
  (ft.first_task_at is not null) as created_task,
  (fc.first_completion_at is not null) as completed_task,
  extract(epoch from (fg.first_goal_at - s.signed_up_at)) / 60 as minutes_to_first_goal,
  extract(epoch from (fc.first_completion_at - s.signed_up_at)) / 3600 as hours_to_first_completion
from signups s
left join first_goal fg on fg.user_id = s.user_id
left join first_task ft on ft.user_id = s.user_id
left join first_completion fc on fc.user_id = s.user_id
order by s.signed_up_at desc;

-- Aggregate funnel summary (run separately, or wrap the above in a CTE named `funnel`):
--
-- with funnel as ( ...query above... )
-- select
--   count(*) as total_signups,
--   count(*) filter (where created_goal) as reached_first_goal,
--   count(*) filter (where created_task) as reached_first_task,
--   count(*) filter (where completed_task) as reached_first_completion,
--   round(100.0 * count(*) filter (where created_goal) / count(*), 1) as pct_created_goal,
--   round(100.0 * count(*) filter (where completed_task) / count(*), 1) as pct_completed_task
-- from funnel;
