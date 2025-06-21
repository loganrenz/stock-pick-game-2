import express from 'express';
import { db } from '../lib/db.js';
import { weeks, picks, users } from '../lib/schema.js';
import { eq, desc, and, lte, gte, isNotNull } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const router = express.Router();

// Get all weeks
router.get('/', async (req, res) => {
  try {
    const allWeeks = await db.select().from(weeks).orderBy(desc(weeks.weekNum));

    // Get all picks with user data
    const allPicks = await db.select().from(picks);
    const allUsers = await db.select().from(users);

    // Create user lookup map
    const userMap = new Map(allUsers.map((user) => [user.id, user]));

    // Attach picks and user data to each week
    const weeksWithPicks = allWeeks.map((week) => {
      const weekPicks = allPicks.filter((pick) => pick.weekId === week.id);
      const picksWithUsers = weekPicks.map((pick) => ({
        ...pick,
        user: userMap.get(pick.userId) || { id: pick.userId, username: 'Unknown' },
      }));

      return {
        ...week,
        picks: picksWithUsers,
      };
    });

    // Return in the format expected by frontend
    res.json({ weeks: weeksWithPicks });
  } catch (error) {
    logger.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current week - this must come before /:id to avoid conflicts
router.get('/current', async (req, res) => {
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

    // Find the week that starts on the calculated Monday
    const currentWeek = await db
      .select()
      .from(weeks)
      .where(eq(weeks.startDate, monday.toISOString()))
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

    // Get picks for this week with user data
    const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((user) => [user.id, user]));

    const picksWithUsers = weekPicks.map((pick) => ({
      ...pick,
      user: userMap.get(pick.userId) || { id: pick.userId, username: 'Unknown' },
    }));

    res.json({
      ...week,
      picks: picksWithUsers,
    });
  } catch (error) {
    logger.error('Error fetching current week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get week by ID - this must come after /current
router.get('/:id', async (req, res) => {
  try {
    const weekId = parseInt(req.params.id);

    if (isNaN(weekId)) {
      return res.status(400).json({ error: 'Invalid week ID' });
    }

    const week = await db.select().from(weeks).where(eq(weeks.id, weekId)).limit(1);

    if (!week || week.length === 0) {
      return res.status(404).json({ error: 'Week not found' });
    }

    // Get picks for this week with user data
    const weekPicks = await db.select().from(picks).where(eq(picks.weekId, weekId));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((user) => [user.id, user]));

    const picksWithUsers = weekPicks.map((pick) => ({
      ...pick,
      user: userMap.get(pick.userId) || { id: pick.userId, username: 'Unknown' },
    }));

    res.json({
      ...week[0],
      picks: picksWithUsers,
    });
  } catch (error) {
    logger.error('Error fetching week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
