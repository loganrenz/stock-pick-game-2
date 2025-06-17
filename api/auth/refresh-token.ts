import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const newToken = jwt.sign({ userId: (req as AuthenticatedRequest).user!.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    await db.update(users)
      .set({ jwtToken: newToken })
      .where(eq(users.id, (req as AuthenticatedRequest).user!.id));

    res.json({ token: newToken });
  });
} 