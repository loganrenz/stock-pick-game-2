import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../lib/db';
import { picks, weeks } from '../lib/schema';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { weekId, symbol, price } = req.body;
    const userId = (req as AuthenticatedRequest).user!.id;

    if (!weekId || !symbol || !price) {
      return res.status(400).json({ error: 'Week ID, symbol, and price are required' });
    }

    try {
      // Check if week exists and is current week
      const week = await db.query.weeks.findFirst({
        where: eq(weeks.id, weekId)
      });

      if (!week) {
        return res.status(404).json({ error: 'Week not found' });
      }

      const now = new Date();
      if (now < new Date(week.startDate) || (week.endDate && now > new Date(week.endDate))) {
        return res.status(400).json({ error: 'Cannot make picks outside of current week' });
      }

      // Check if user already has a pick for this week
      const existingPick = await db.query.picks.findFirst({
        where: and(
          eq(picks.weekId, weekId),
          eq(picks.userId, userId)
        )
      });

      if (existingPick) {
        // Update existing pick
        const [updatedPick] = await db.update(picks)
          .set({
            symbol,
            entryPrice: parseFloat(price)
          })
          .where(eq(picks.id, existingPick.id))
          .returning();
        return res.json(updatedPick);
      }

      // Create new pick
      const [newPick] = await db.insert(picks)
        .values({
          weekId,
          userId,
          symbol,
          entryPrice: parseFloat(price)
        })
        .returning();

      res.json(newPick);
    } catch (error) {
      console.error('Error creating/updating pick:', error);
      res.status(500).json({ error: 'Failed to create/update pick' });
    }
  });
} 