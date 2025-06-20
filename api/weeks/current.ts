import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { getCurrentWeek, getActiveWeek, getLivePrice } from '../../api-helpers/weeks.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the active week for price updates, but get the current/most recent week for display.
    const activeWeek = await getActiveWeek();

    // If a week is currently active, update its prices
    if (activeWeek) {
      await db.transaction(async (tx) => {
        const picksToUpdate = await tx.query.picks.findMany({
          where: eq(picks.weekId, activeWeek.id),
        });

        await Promise.all(
          picksToUpdate.map(async (pick) => {
            const livePrice = await getLivePrice(pick.symbol);

            if (livePrice !== null) {
              const needsEntryPrice = pick.entryPrice === null || pick.entryPrice === 0;
              const newEntryPrice = needsEntryPrice ? livePrice : pick.entryPrice;
              const returnPercentage =
                newEntryPrice && livePrice
                  ? ((livePrice - newEntryPrice) / newEntryPrice) * 100
                  : 0;

              await tx
                .update(picks)
                .set({
                  entryPrice: newEntryPrice,
                  currentValue: livePrice,
                  returnPercentage: returnPercentage,
                })
                .where(eq(picks.id, pick.id));
            }
          }),
        );
      });
    }

    // Always fetch the current week for display (could be active or most recent past)
    const displayWeek = await getCurrentWeek();

    if (!displayWeek) {
      return res.status(404).json({ message: 'No week found.' });
    }

    // We need to re-fetch the week data to get the updated picks
    const updatedDisplayWeek = await db.query.weeks.findFirst({
      where: eq(db.weeks.id, displayWeek.id),
      with: {
        picks: {
          with: {
            user: true,
          },
        },
      },
    });

    res.status(200).json(updatedDisplayWeek);
  } catch (error) {
    console.error('Error fetching current week data:', error);
    res.status(500).json({ message: 'Failed to fetch current week data' });
  }
}
