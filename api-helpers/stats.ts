import { db } from './lib/db.js';
import { users, weeks, picks } from './lib/schema.js';

export async function getStats() {
  try {
    const allUsers = await db.query.users.findMany();
    const allWeeks = await db.query.weeks.findMany();
    const allPicks = await db.query.picks.findMany();
    return { users: allUsers, weeks: allWeeks, picks: allPicks };
  } catch (error) {
    console.error('Stats error:', error);
    throw new Error('Failed to fetch stats');
  }
}
