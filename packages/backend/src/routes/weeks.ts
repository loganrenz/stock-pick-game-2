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

    // Find current week by checking which week the current time falls into
    const currentWeek = await db
      .select()
      .from(weeks)
      .where(and(lte(weeks.startDate, now.toISOString()), gte(weeks.endDate, now.toISOString())))
      .limit(1);

    if (currentWeek && currentWeek.length > 0) {
      const week = currentWeek[0];

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
      return;
    }

    // If no current active week, we're in a weekend gap
    // Show the most recently completed week (the one that just ended)
    const lastCompletedWeek = await db
      .select()
      .from(weeks)
      .where(lte(weeks.endDate, now.toISOString()))
      .orderBy(desc(weeks.endDate))
      .limit(1);

    if (lastCompletedWeek && lastCompletedWeek.length > 0) {
      const week = lastCompletedWeek[0];

      // Get picks for this week with user data
      const weekPicks = await db.select().from(picks).where(eq(picks.weekId, week.id));
      const allUsers = await db.select().from(users);
      const userMap = new Map(allUsers.map((user) => [user.id, user]));

      const picksWithUsers = weekPicks.map((pick) => ({
        ...pick,
        user: userMap.get(pick.userId) || { id: pick.userId, username: 'Unknown' },
      }));

      // Auto-determine winner if not set
      let weekWithWinner = { ...week };
      // if (!week.winnerId && picksWithUsers.length > 0) {
      //   // Find the pick with the highest return percentage
      //   const winner = picksWithUsers.reduce((best, current) =>
      //     (current.returnPercentage || 0) > (best.returnPercentage || 0) ? current : best
      //   );
      //
      //   if (winner && winner.returnPercentage !== null) {
      //     // Update the database with the winner
      //     await db
      //       .update(weeks)
      //       .set({ winnerId: winner.userId })
      //       .where(eq(weeks.id, week.id));
      //
      //     weekWithWinner.winnerId = winner.userId;
      //   }
      // }

      res.json({
        ...weekWithWinner,
        picks: picksWithUsers,
      });
      return;
    }

    // If still no week found, get the most recent week as fallback
    const lastWeek = await db.select().from(weeks).orderBy(desc(weeks.weekNum)).limit(1);

    if (lastWeek && lastWeek.length > 0) {
      const week = lastWeek[0];

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
      return;
    }

    // If no weeks exist at all, return null
    res.json(null);
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

// Set winner for a week (for testing)
router.put('/:id/winner', async (req, res) => {
  try {
    const weekId = parseInt(req.params.id);
    const { winnerId } = req.body;

    if (isNaN(weekId)) {
      return res.status(400).json({ error: 'Invalid week ID' });
    }

    if (!winnerId) {
      return res.status(400).json({ error: 'winnerId is required' });
    }

    // First try updating a simple field to test if table updates work at all
    await db.update(weeks).set({ updatedAt: new Date().toISOString() }).where(eq(weeks.id, weekId));

    logger.info(`Successfully updated updatedAt for week ${weekId}`);

    // Now try updating winnerId
    // First set to null to clear any existing value
    await db.update(weeks).set({ winnerId: null }).where(eq(weeks.id, weekId));

    logger.info(`Successfully cleared winnerId for week ${weekId}`);

    // Then set to the desired value
    await db.update(weeks).set({ winnerId: winnerId }).where(eq(weeks.id, weekId));

    res.json({ success: true, message: `Winner set for week ${weekId}` });
  } catch (error) {
    logger.error('Error setting winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
