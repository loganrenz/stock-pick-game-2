-- Migration: Fix week start and end dates to always be Monday (start) and Friday (end)
-- This script will update all weeks so that:
--   - startDate is set to the most recent Monday (00:00:00) before or on the current startDate
--   - endDate is set to the following Friday (23:59:59.999)

-- SQLite does not have a direct way to get the previous Monday, so we use date math
-- This migration is idempotent and safe to run multiple times

UPDATE Week
SET startDate = (
  -- Find the most recent Monday on or before the current startDate
  date(startDate, '-' || ((strftime('%w', startDate) + 6) % 7) || ' days')
  || 'T00:00:00.000Z'
),
endDate = (
  -- Set endDate to the Friday of the same week as the new startDate
  date(
    date(startDate, '-' || ((strftime('%w', startDate) + 6) % 7) || ' days'),
    '+4 days'
  ) || 'T23:59:59.999Z'
)
WHERE 1=1; 