-- Flexible weekly tasks: "complete N times anytime during the week"
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- tasks.frequency values: 'daily' | 'specific_days' | 'flexible'
--   specific_days → uses scheduled_days (0 = Sun … 6 = Sat)
--   flexible      → uses times_per_week (1–7)
-- Existing daily / specific_days rows are unaffected: times_per_week stays null.

alter table tasks
  add column if not exists times_per_week smallint
  check (times_per_week between 1 and 7);

-- 1. Drop the old constraint, which allowed 'daily' | 'weekly' | 'specific_days'.
alter table tasks drop constraint if exists tasks_frequency_check;

-- 2. The old 'weekly' value (once a week, from the reverted weekly-tasks work) is
--    the same as flexible with times_per_week = 1. Convert any such rows.
--    Their logs keep their existing dates.
update tasks
  set frequency = 'flexible', times_per_week = 1
  where frequency = 'weekly';

-- 3. Allow 'flexible', drop 'weekly'. (One-time tasks have frequency = null,
--    which a check constraint always lets through.)
alter table tasks add constraint tasks_frequency_check
  check (frequency in ('daily', 'specific_days', 'flexible'));
