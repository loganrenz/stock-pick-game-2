import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';
import { db } from '../../api-helpers/lib/db.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { eq, and } from 'drizzle-orm';

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

  const path = req.url?.split('/').pop() || '';

  switch (path) {
    case 'create':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const { weekId, symbol, entryPrice } = req.body;
          if (weekId == null || symbol == null || entryPrice == null) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          const [pick] = await db
            .insert(picks)
            .values({
              userId: (req as AuthenticatedRequest).user!.id,
              weekId,
              symbol,
              entryPrice,
            })
            .returning();
          return res.status(201).json(pick);
        } catch (error) {
          console.error('Create pick error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    case 'update':
      if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const { pickId, symbol, entryPrice, currentValue, weekReturn, returnPercentage } =
            req.body;

          if (!pickId) {
            return res.status(400).json({ error: 'Pick ID is required' });
          }

          const updateFields: any = {};
          if (symbol !== undefined) updateFields.symbol = symbol;
          if (entryPrice !== undefined) updateFields.entryPrice = entryPrice;
          if (currentValue !== undefined) updateFields.currentValue = currentValue;
          if (weekReturn !== undefined) updateFields.weekReturn = weekReturn;
          if (returnPercentage !== undefined) updateFields.returnPercentage = returnPercentage;
          updateFields.updatedAt = new Date().toISOString();

          const [updatedPick] = await db
            .update(picks)
            .set(updateFields)
            .where(eq(picks.id, pickId))
            .returning();

          if (!updatedPick) {
            return res.status(404).json({ error: 'Pick not found' });
          }

          return res.status(200).json(updatedPick);
        } catch (error) {
          console.error('Update pick error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    case 'delete':
      if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const { pickId } = req.body;
          if (!pickId) {
            return res.status(400).json({ error: 'Pick ID is required' });
          }
          const [deletedPick] = await db
            .delete(picks)
            .where(
              and(eq(picks.id, pickId), eq(picks.userId, (req as AuthenticatedRequest).user!.id)),
            )
            .returning();
          if (!deletedPick) {
            return res.status(404).json({ error: 'Pick not found' });
          }
          return res.status(200).json({ message: 'Pick deleted successfully' });
        } catch (error) {
          console.error('Delete pick error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    default:
      return res.status(404).json({ error: 'Not found' });
  }
}
