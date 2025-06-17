import { NextApiRequest, NextApiResponse } from 'next';
import { startOfWeek, endOfWeek } from 'date-fns';
import { db } from '../lib/db';
import { weeks, picks, users } from '../lib/schema';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { eq, lte, gte, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      });

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
        });

        return res.json(weekWithPicks);
      }

      res.json(currentWeek);
    } catch (error) {
      console.error('Error fetching current week:', error);
      res.status(500).json({ error: 'Failed to fetch current week' });
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