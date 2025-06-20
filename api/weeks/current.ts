import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { getCurrentWeek } from '../../api-helpers/weeks.js';
import { weeks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the current week for display (could be active or most recent past)
    const displayWeek = await getCurrentWeek();

    if (!displayWeek) {
      return res.status(404).json({ message: 'No week found.' });
    }

    // Fetch the week data with picks and users
    const currentWeekData = await db.query.weeks.findFirst({
      where: eq(weeks.id, displayWeek.id),
      with: {
        picks: {
          with: {
            user: true,
          },
        },
      },
    });

    res.status(200).json(currentWeekData);
  } catch (error) {
    console.error('Error fetching current week data:', error);
    res.status(500).json({ message: 'Failed to fetch current week data' });
  }
}
