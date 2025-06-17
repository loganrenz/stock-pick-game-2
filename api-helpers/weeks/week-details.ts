import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db.js';
import { weeks } from '../lib/schema';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Week ID is required' });
    }

    try {
      const week = await db.query.weeks.findFirst({
        where: eq(weeks.id, parseInt(id)),
        with: {
          picks: {
            with: {
              user: true
            }
          }
        }
      });

      if (!week) {
        return res.status(404).json({ error: 'Week not found' });
      }

      res.json(week);
    } catch (error) {
      console.error('Error fetching week:', error);
      res.status(500).json({ error: 'Failed to fetch week' });
    }
  });
} 