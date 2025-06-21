import express from 'express';
import { db } from '../lib/db.js';
import { users, weeks, picks } from '../lib/schema.js';
import { eq, desc, inArray, isNotNull } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const router = express.Router();

// GET /api/scoreboard - Get the main scoreboard
router.get('/', async (req, res) => {
  try {
    const completedWeeks = await db.select().from(weeks).where(isNotNull(weeks.winnerId));

    const userScores = new Map<
      number,
      { userId: number; username: string; wins: number; totalReturn: number; totalPicks: number }
    >();

    for (const week of completedWeeks) {
      if (week.winnerId) {
        const user = await db.query.users.findFirst({ where: eq(users.id, week.winnerId) });
        if (user) {
          const score = userScores.get(week.winnerId) || {
            userId: week.winnerId,
            username: user.username || 'N/A',
            wins: 0,
            totalReturn: 0,
            totalPicks: 0,
          };
          score.wins += 1;
          userScores.set(week.winnerId, score);
        }
      }
    }

    const allPicks = await db.select().from(picks);
    for (const pick of allPicks) {
      const user = await db.query.users.findFirst({ where: eq(users.id, pick.userId) });
      if (user) {
        const score = userScores.get(pick.userId) || {
          userId: pick.userId,
          username: user.username || 'N/A',
          wins: 0,
          totalReturn: 0,
          totalPicks: 0,
        };
        if (pick.returnPercentage !== null) {
          score.totalReturn += pick.returnPercentage;
        }
        score.totalPicks += 1;
        userScores.set(pick.userId, score);
      }
    }

    const scoreboard = Array.from(userScores.values())
      .map((score) => ({
        ...score,
        averageReturn: score.totalPicks > 0 ? score.totalReturn / score.totalPicks : 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.averageReturn - a.averageReturn);

    res.json(scoreboard);
  } catch (error: any) {
    logger.error('Error fetching scoreboard:', error);
    res.status(500).json({ error: 'Failed to fetch scoreboard' });
  }
});

// GET /api/scoreboard/:userId - Get stats for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userPicks = await db.select().from(picks).where(eq(picks.userId, userId));
    const wins = (await db.select().from(weeks).where(eq(weeks.winnerId, userId))).length;

    let totalReturn = 0;
    let highestReturn = -Infinity;
    let lowestReturn = Infinity;

    for (const pick of userPicks) {
      if (pick.returnPercentage !== null) {
        totalReturn += pick.returnPercentage;
        highestReturn = Math.max(highestReturn, pick.returnPercentage);
        lowestReturn = Math.min(lowestReturn, pick.returnPercentage);
      }
    }

    const stats = {
      userId: user.id,
      username: user.username,
      wins,
      totalPicks: userPicks.length,
      averageReturn: userPicks.length > 0 ? totalReturn / userPicks.length : 0,
      highestReturn: highestReturn === -Infinity ? null : highestReturn,
      lowestReturn: lowestReturn === Infinity ? null : lowestReturn,
    };

    res.json(stats);
  } catch (error: any) {
    logger.error(`Error fetching stats for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

export default router;
