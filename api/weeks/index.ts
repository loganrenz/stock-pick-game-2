import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { weeks } from '../../api-helpers/lib/schema.js';
import { eq, lte, gte, asc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[WEEKS] Request received:', {
    method: req.method,
    url: req.url,
    path: req.url?.split('/').pop() || '',
    headers: req.headers
  });

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
    console.log('[WEEKS] Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  const path = req.url?.split('/').pop() || '';
  console.log('[WEEKS] Processing path:', path);

  switch (path) {
    case 'current':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for /current:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching current week');
        console.log('[WEEKS] DB URL:', process.env.TURSO_DB_URL);
        console.log('[WEEKS] DB Token:', process.env.TURSO_DB_TOKEN);
        const now = new Date();
        const currentWeek = await db.query.weeks.findFirst({
          where: and(
            lte(weeks.startDate, now.toISOString()),
            gte(weeks.endDate, now.toISOString())
          ),
          with: {
            picks: true,
            winner: true
          }
        });

        if (!currentWeek) {
          console.log('[WEEKS] No current week found, creating new week');
          // Create a new week if none exists
          const [newWeek] = await db.insert(weeks).values({
            weekNum: 1,
            startDate: now.toISOString(),
            endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }).returning();
          return res.status(200).json(newWeek);
        }

        // Fetch all users for mapping
        const allUsers = await db.query.users.findMany();
        // Attach user object to each pick
        const weekWithUserPicks = {
          ...currentWeek,
          picks: currentWeek.picks.map(pick => ({
            ...pick,
            user: allUsers.find(u => u.id === pick.userId) || { id: pick.userId, username: 'Unknown' }
          }))
        };
        console.log('[WEEKS] Found current week:', weekWithUserPicks);
        return res.status(200).json(weekWithUserPicks);
      } catch (error) {
        console.error('[WEEKS] Current week error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'list':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for /list:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching all weeks');
        const allWeeks = await db.query.weeks.findMany({
          orderBy: asc(weeks.weekNum)
        });
        console.log('[WEEKS] Found weeks:', allWeeks);
        return res.status(200).json({ weeks: allWeeks });
      } catch (error) {
        console.error('[WEEKS] List weeks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case '':
    case 'weeks':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for root path:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching all weeks from root path');
        console.log('[WEEKS] TURSO_DB_URL:', process.env.TURSO_DB_URL);
        console.log('[WEEKS] TURSO_DB_TOKEN:', process.env.TURSO_DB_TOKEN);
        // Fetch all weeks with picks and winner info
        const allWeeks = await db.query.weeks.findMany({
          orderBy: asc(weeks.weekNum),
          with: {
            picks: true,
            winner: true
          }
        });
        // Fetch all users for mapping
        const allUsers = await db.query.users.findMany();
        // Attach user object to each pick
        const weeksWithUserPicks = allWeeks.map(week => ({
          ...week,
          picks: week.picks.map(pick => ({
            ...pick,
            user: allUsers.find(u => u.id === pick.userId) || { id: pick.userId, username: 'Unknown' }
          }))
        }));
        console.log('[WEEKS] Found weeks:', weeksWithUserPicks);
        return res.status(200).json({ weeks: weeksWithUserPicks });
      } catch (error) {
        console.error('[WEEKS] List weeks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      console.log('[WEEKS] Path not found:', path);
      return res.status(404).json({ error: 'Not found' });
  }
} 