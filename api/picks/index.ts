import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';
import { db } from '../../api-helpers/lib/db.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // This handler is now specifically for creating a new pick.
  // The functionality for update and delete has been moved to their own files.

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
      const { weekId, symbol } = req.body;
      if (weekId == null || !symbol) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const [pick] = await db
        .insert(picks)
        .values({
          userId: (req as AuthenticatedRequest).user!.id,
          weekId,
          symbol,
        })
        .returning();
      return res.status(201).json(pick);
    } catch (error) {
      console.error('Create pick error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
