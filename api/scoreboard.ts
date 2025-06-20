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
    const weeksWithWinners = await db.query.weeks.findMany({
      where: isNotNull(weeks.winnerId),
      with: {
        winner: true,
      },
    });

    const allUsers = await db.query.users.findMany();

    const scoreboard = allUsers.map((user) => {
      const wins = weeksWithWinners.filter((week) => week.winnerId === user.id).length;
      return {
        username: user.username,
        wins,
      };
    });

    scoreboard.sort((a, b) => b.wins - a.wins);

    return res.status(200).json(scoreboard);
  } catch (error) {
    return res.status(200).json([]);
  }
}
