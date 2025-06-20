import express from 'express';
import { db } from '../../lib/db.js';
import { weeks, picks, users } from '../../lib/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { logger } from '../../lib/logger.js';

const router = express.Router();

// Get current week
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    // Find current week by date range
    const currentWeek = await db
      .select()
      .from(weeks)
      .where(and(lte(weeks.startDate, now.toISOString()), gte(weeks.endDate, now.toISOString())))
      .limit(1);

    if (!currentWeek || currentWeek.length === 0) {
      // Get the highest week number
      const lastWeek = await db.select().from(weeks).orderBy(desc(weeks.weekNum)).limit(1);
      const nextWeekNum = lastWeek && lastWeek.length > 0 ? Number(lastWeek[0].weekNum) + 1 : 1;

      const [newWeek] = await db
        .insert(weeks)
        .values({
          weekNum: nextWeekNum,
          startDate: monday.toISOString(),
          endDate: friday.toISOString(),
        })
        .returning();

      // Return the new week with empty picks array
      res.json({
        ...newWeek,
        picks: [],
      });
      return;
    }

    const week = currentWeek[0];

    // Update current week dates if they don't match
    if (week.startDate !== monday.toISOString() || week.endDate !== friday.toISOString()) {
      await db
        .update(weeks)
        .set({
          startDate: monday.toISOString(),
          endDate: friday.toISOString(),
        })
        .where(eq(weeks.id, week.id));
      week.startDate = monday.toISOString();
      week.endDate = friday.toISOString();
    }

    // Get picks for this week
    const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));

    res.json({
      ...week,
      picks: weekPicks,
    });
  } catch (error) {
    logger.error('Error fetching current week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
