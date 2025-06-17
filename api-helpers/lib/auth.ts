import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRY = '365d'; // 1 year
export const JWT_REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: number;
    username: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: VercelResponse,
  next: () => void
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('[requireAuth] Received token:', token);
  
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; exp: number };
    console.log('[requireAuth] Decoded token:', decoded);
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
    });
    console.log('[requireAuth] User from DB:', user);

    if (!user || user.jwtToken !== token) {
      console.log('[requireAuth] Token mismatch or user not found. user.jwtToken:', user?.jwtToken, 'token:', token);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if token needs refresh (if less than 7 days until expiry)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < JWT_REFRESH_THRESHOLD) {
      console.log('Token refresh needed. Current time:', new Date(now * 1000).toISOString());
      console.log('Token expires at:', new Date(decoded.exp * 1000).toISOString());
      const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      await db.update(users)
        .set({ jwtToken: newToken })
        .where(eq(users.id, user.id));
      res.setHeader('X-New-Token', newToken);
      console.log('New token issued with expiration:', new Date((now + 365 * 24 * 60 * 60) * 1000).toISOString());
    }

    req.user = {
      id: user.id,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('[requireAuth] Error during token verification or user lookup:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
} 