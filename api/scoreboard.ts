import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../api-helpers/lib/db.js';
import { weeks, users } from '../api-helpers/lib/schema.js';
import { eq, isNotNull } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[SCOREBOARD] Fetching scoreboard data');

    // Get all weeks that have a winner
    const weeksWithWinners = await db.query.weeks.findMany({
      where: isNotNull(weeks.winnerId),
      with: {
        winner: true,
      },
    });
    console.log('[SCOREBOARD] Weeks with winners:', weeksWithWinners);

    // Get all users
    const allUsers = await db.query.users.findMany();
    console.log('[SCOREBOARD] All users:', allUsers);

    // Calculate wins for each user
    const scoreboard = allUsers.map((user) => {
      const wins = weeksWithWinners.filter((week) => week.winnerId === user.id).length;
      return {
        username: user.username,
        wins,
      };
    });

    // Sort by wins (descending)
    scoreboard.sort((a, b) => b.wins - a.wins);

    console.log('[SCOREBOARD] Final scoreboard data:', scoreboard);
    return res.status(200).json(scoreboard);
  } catch (error) {
    console.error('[SCOREBOARD] Error:', error);
    // Return empty array instead of error object to prevent type issues
    return res.status(200).json([]);
  }
}
