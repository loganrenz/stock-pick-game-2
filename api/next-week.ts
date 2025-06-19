import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../api-helpers/lib/db.js';
import { weeks } from '../api-helpers/lib/schema.js';
import { desc, eq, gt, gte } from 'drizzle-orm';
import { requireAuth } from '../api-helpers/lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the current week first
    const now = new Date();
    const currentWeek = await db.query.weeks.findFirst({
      where: gte(weeks.endDate, now.toISOString()),
      orderBy: [desc(weeks.weekNum)],
      with: {
        picks: true,
      },
    });

    if (!currentWeek) {
      return res.status(404).json({ error: 'No current week found' });
    }

    // Look for an existing next week
    const nextWeek = await db.query.weeks.findFirst({
      where: gt(weeks.weekNum, currentWeek.weekNum),
      with: {
        picks: true,
      },
    });

    if (nextWeek) {
      return res.status(200).json(nextWeek);
    }

    // Create next week if it doesn't exist
    const nextStart = new Date(currentWeek.endDate);
    nextStart.setDate(nextStart.getDate() + 3); // Friday + 3 days = Monday
    nextStart.setHours(0, 0, 0, 0);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + 4); // Monday + 4 days = Friday
    nextEnd.setHours(23, 59, 59, 999);

    const [createdWeek] = await db
      .insert(weeks)
      .values({
        weekNum: currentWeek.weekNum + 1,
        startDate: nextStart.toISOString(),
        endDate: nextEnd.toISOString(),
      })
      .returning();

    return res.status(200).json(createdWeek);
  } catch (error) {
    console.error('Next week error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
