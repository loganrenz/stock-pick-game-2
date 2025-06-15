import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year
const JWT_REFRESH_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    username: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; exp: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.jwtToken !== token) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if token needs refresh (if less than 30 days until expiry)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < JWT_REFRESH_THRESHOLD / 1000) {
      const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      await prisma.user.update({
        where: { id: user.id },
        data: { jwtToken: newToken }
      });
      res.setHeader('X-New-Token', newToken);
    }

    req.user = {
      id: user.id,
      username: user.username
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}; 