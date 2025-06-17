import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { weeks } from '../../api-helpers/lib/schema.js';
import { eq, lte, gte, asc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';

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

  const path = req.url?.split('/').pop() || '';

  switch (path) {
    case 'current':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const now = new Date();
          const currentWeek = await db.query.weeks.findFirst({
            where: and(
              lte(weeks.startDate, now.toISOString()),
              gte(weeks.endDate, now.toISOString())
            ),
            with: {
              picks: true
            }
          });

          if (!currentWeek) {
            // Create a new week if none exists
            const [newWeek] = await db.insert(weeks).values({
              weekNum: 1,
              startDate: now.toISOString(),
              endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }).returning();
            return res.status(200).json({ week: newWeek });
          }

          return res.status(200).json({ week: currentWeek });
        } catch (error) {
          console.error('Current week error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    case 'list':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const allWeeks = await db.query.weeks.findMany({
            orderBy: asc(weeks.weekNum)
          });
          return res.status(200).json({ weeks: allWeeks });
        } catch (error) {
          console.error('List weeks error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    default:
      return res.status(404).json({ error: 'Not found' });
  }
} 