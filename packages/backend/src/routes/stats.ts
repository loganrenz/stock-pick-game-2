import express from 'express';
import { db } from '../lib/db.js';
import { users, weeks, picks } from '../lib/schema.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Fetch all users, weeks, and picks
    const allUsers = await db.select().from(users);
    const allWeeks = await db.select().from(weeks);
    const allPicks = await db.select().from(picks);

    res.json({
      users: allUsers,
      weeks: allWeeks,
      picks: allPicks,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
