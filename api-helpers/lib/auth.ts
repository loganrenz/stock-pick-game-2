import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { config } from './config.js';

const JWT_SECRET = config.jwt.secret as jwt.Secret;
const JWT_EXPIRY = config.jwt.expiry as import('jsonwebtoken').SignOptions['expiresIn'];
export const JWT_REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AuthenticatedRequest extends VercelRequest {
  user: {
    id: number;
    username: string;
  };
}

export const requireAuth =
  (handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<any>) =>
  async (req: VercelRequest, res: VercelResponse) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; exp: number };
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      (req as AuthenticatedRequest).user = {
        id: user.id,
        username: user.username,
      };

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
