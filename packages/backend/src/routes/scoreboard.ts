import express from 'express';
import { db } from '../lib/db.js';
import { users, weeks, picks } from '../lib/schema.js';
import { eq, desc, and, isNotNull, inArray } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const router = express.Router();

// Get scoreboard
router.get('/', async (req, res) => {
  try {
    // Get all users
    const allUsers = await db.select().from(users);

    // Get all completed weeks (weeks with winners)
    const completedWeeks = await db.select().from(weeks).where(isNotNull(weeks.winnerId));

    // Get all picks
    const allPicks = await db.select().from(picks);

    // Calculate scores for each user
    const scoreboard = allUsers.map((user) => {
      const userPicks = allPicks.filter((pick) => pick.userId === user.id);

      // Calculate total return percentage
      const totalReturn = userPicks.reduce((sum, pick) => {
        return sum + (pick.returnPercentage || 0);
      }, 0);

      // Count wins (picks where user won the week)
      const wins = completedWeeks.filter((week) => week.winnerId === user.id).length;

      // Count total picks
      const totalPicks = userPicks.length;

      // Calculate average return
      const averageReturn = totalPicks > 0 ? totalReturn / totalPicks : 0;

      return {
        id: user.id,
        username: user.username,
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        averageReturn: parseFloat(averageReturn.toFixed(2)),
        wins,
        totalPicks,
        picks: userPicks,
      };
    });

    // Sort by total return (descending)
    scoreboard.sort((a, b) => b.totalReturn - a.totalReturn);

    res.json(scoreboard);
  } catch (error) {
    logger.error('Error fetching scoreboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's detailed scoreboard
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's picks with week information
    const userPicks = await db.select().from(picks).where(eq(picks.userId, userId));

    // Get weeks for context
    const weekIds = [...new Set(userPicks.map((pick) => pick.weekId))];
    const weeks = await db.select().from(weeks).where(inArray(weeks.id, weekIds));

    // Calculate detailed stats
    const totalReturn = userPicks.reduce((sum, pick) => sum + (pick.returnPercentage || 0), 0);
    const wins = weeks.filter((week) => week.winnerId === userId).length;
    const totalPicks = userPicks.length;
    const averageReturn = totalPicks > 0 ? totalReturn / totalPicks : 0;

    // Get best and worst picks
    const bestPick = userPicks.reduce((best, pick) =>
      (pick.returnPercentage || 0) > (best.returnPercentage || 0) ? pick : best,
    );

    const worstPick = userPicks.reduce((worst, pick) =>
      (pick.returnPercentage || 0) < (worst.returnPercentage || 0) ? pick : worst,
    );

    res.json({
      user: user[0],
      stats: {
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        averageReturn: parseFloat(averageReturn.toFixed(2)),
        wins,
        totalPicks,
        bestPick,
        worstPick,
      },
      picks: userPicks.map((pick) => {
        const week = weeks.find((w) => w.id === pick.weekId);
        return {
          ...pick,
          week,
        };
      }),
    });
  } catch (error) {
    logger.error('Error fetching user scoreboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
