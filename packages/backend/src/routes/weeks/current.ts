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

    // Find current week by checking which week the current time falls into
    const currentWeek = await db
      .select()
      .from(weeks)
      .where(and(lte(weeks.startDate, now.toISOString()), gte(weeks.endDate, now.toISOString())))
      .limit(1);

    if (currentWeek && currentWeek.length > 0) {
      const week = currentWeek[0];

      // Get picks for this week
      const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));

      res.json({
        ...week,
        picks: weekPicks,
      });
      return;
    }

    // If no current week found, check if we should be in the next week
    // (e.g., we're in the gap between weeks, like Sunday 3 AM to Monday 4 AM)
    const nextWeek = await db
      .select()
      .from(weeks)
      .where(gte(weeks.startDate, now.toISOString()))
      .orderBy(weeks.startDate)
      .limit(1);

    if (nextWeek && nextWeek.length > 0) {
      const week = nextWeek[0];

      // Get picks for this week
      const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));

      res.json({
        ...week,
        picks: weekPicks,
      });
      return;
    }

    // If still no week found, get the most recent week
    const lastWeek = await db.select().from(weeks).orderBy(desc(weeks.weekNum)).limit(1);

    if (lastWeek && lastWeek.length > 0) {
      const week = lastWeek[0];

      // Get picks for this week
      const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));

      res.json({
        ...week,
        picks: weekPicks,
      });
      return;
    }

    // If no weeks exist at all, return null
    res.json(null);
  } catch (error) {
    logger.error('Error fetching current week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
