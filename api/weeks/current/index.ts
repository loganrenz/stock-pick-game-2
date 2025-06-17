import type { VercelRequest, VercelResponse } from '@vercel/node';
import { startOfWeek, endOfWeek } from 'date-fns';
import { eq, lte, gte, asc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Week as WeekType, Pick as PickType, User as UserType, DailyPrice } from '../../../src/types/index.js';
import { db } from '../../lib/db.js';
import { weeks } from '../../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../../lib/auth.js';

console.log('[API] TURSO_DB_URL:', process.env.TURSO_DB_URL);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Current week request received:', {
    method: req.method,
    headers: req.headers,
    url: req.url,
  });

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
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
      console.log('Auth successful, fetching current week');
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

      const currentWeekRaw = await db.query.weeks.findFirst({
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
      }) as unknown;

      let currentWeek: (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType; dailyPriceData?: { [key: string]: DailyPrice } })[] }) | null = null;

      if (currentWeekRaw) {
        currentWeek = {
          ...(currentWeekRaw as object),
          picks: (currentWeekRaw as any).picks.map((pick: any) => ({
            ...pick,
            dailyPriceData: pick.dailyPriceData ? JSON.parse(pick.dailyPriceData) : undefined
          }))
        } as unknown as (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType; dailyPriceData?: { [key: string]: DailyPrice } })[] });
      }

      console.log('Current week query result:', currentWeek);

      if (!currentWeek) {
        console.log('No current week found, creating new week');
        // Create new week if none exists
        const [newWeek] = await db.insert(weeks)
          .values({
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            weekNum: await calculateWeekNumber(weekStart)
          })
          .returning();

        // Fetch the newly created week with its picks and users
        const weekWithPicksRaw = await db.query.weeks.findFirst({
          where: eq(weeks.id, newWeek.id),
          with: {
            picks: {
              with: {
                user: true
              }
            }
          }
        }) as unknown;

        let weekWithPicks: (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType; dailyPriceData?: { [key: string]: DailyPrice } })[] }) | null = null;
        if (weekWithPicksRaw) {
          weekWithPicks = {
            ...(weekWithPicksRaw as object),
            picks: (weekWithPicksRaw as any).picks.map((pick: any) => ({
              ...pick,
              dailyPriceData: pick.dailyPriceData ? JSON.parse(pick.dailyPriceData) : undefined
            }))
          } as unknown as (Omit<WeekType, 'picks'> & { picks: (Omit<PickType, 'user'> & { user: UserType; dailyPriceData?: { [key: string]: DailyPrice } })[] });
        }

        if (!weekWithPicks) {
          console.error('Failed to fetch newly created week');
          throw new Error('Failed to fetch newly created week');
        }

        console.log('Returning newly created week:', weekWithPicks);
        return res.status(200).json(weekWithPicks);
      }

      console.log('Returning existing current week:', currentWeek);
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