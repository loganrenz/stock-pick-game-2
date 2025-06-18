import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../api-helpers/lib/db.js';
import { weeks } from '../api-helpers/lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../api-helpers/lib/auth.js';
import { asc, desc, and, not } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all weeks ordered by weekNum descending
    const allWeeks = await db.query.weeks.findMany({ orderBy: desc(weeks.weekNum) });
    if (!allWeeks.length) {
      return res.status(404).json({ error: 'No weeks found' });
    }
    // Assume the first is the next week (highest weekNum)
    const nextWeek = allWeeks[0];
    return res.status(200).json(nextWeek);
  } catch (error) {
    console.error('Next week error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 