import type { VercelRequest, VercelResponse } from '@vercel/node';
import { startOfWeek, endOfWeek } from 'date-fns';
import { db } from '../lib/db.js';
import { weeks, picks, users } from '../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../lib/auth.js';
import { eq, lte, gte, asc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Week as WeekType, Pick as PickType, User as UserType } from '../../src/types/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Content-Type', 'application/json');

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
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

      const currentWeek = await db.query.weeks.findFirst({
        where: and(
          lte(weeks.startDate, today.toISOString()),
          gte(weeks.endDate, today.toISOString())
        ),
        with: {
          picks: {
            with: {
              user: true
            }
          }
        }
      }) as (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType })[] }) | null;

      if (!currentWeek) {
        // Create new week if none exists
        const [newWeek] = await db.insert(weeks)
          .values({
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            weekNum: await calculateWeekNumber(weekStart)
          })
          .returning();

        // Fetch the newly created week with its picks and users
        const weekWithPicks = await db.query.weeks.findFirst({
          where: eq(weeks.id, newWeek.id),
          with: {
            picks: {
              with: {
                user: true
              }
            }
          }
        }) as (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType })[] }) | null;

        if (!weekWithPicks) {
          throw new Error('Failed to fetch newly created week');
        }

        return res.status(200).json(weekWithPicks);
      }

      res.status(200).json(currentWeek);
    } catch (error) {
      console.error('Error fetching current week:', error);
      res.status(500).json({ error: 'Failed to fetch current week', details: error instanceof Error ? error.message : error });
    }
  });
}

async function calculateWeekNumber(startDate: Date): Promise<number> {
  const firstWeek = await db.query.weeks.findFirst({
    orderBy: [asc(weeks.startDate)]
  });

  if (!firstWeek) {
    return 1;
  }

  const weekCount = await db.select({ count: sql<number>`count(*)` })
    .from(weeks)
    .where(lte(weeks.startDate, startDate.toISOString()));

  return weekCount[0].count + 1;
} 