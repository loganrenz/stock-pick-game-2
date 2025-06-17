import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db.js';
import { users, picks, weeks } from '../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
      const allUsers = await db.query.users.findMany({
        with: {
          picks: {
            with: {
              week: true
            }
          }
        }
      });

      // Calculate stats for each user
      const usersWithStats = allUsers.map(user => {
        const wins = user.picks.filter(pick => 
          pick.week?.winnerId === user.id
        ).length;

        const totalPicks = user.picks.length;
        const winRate = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;

        return {
          id: user.id,
          username: user.username,
          wins,
          totalPicks,
          winRate,
          createdAt: user.createdAt
        };
      });

      res.json(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
} 