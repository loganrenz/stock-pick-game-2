import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '@api/lib/db';
import { requireAuth, AuthenticatedRequest } from '@api/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const newToken = jwt.sign({ userId: (req as AuthenticatedRequest).user!.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    await prisma.user.update({
      where: { id: (req as AuthenticatedRequest).user!.id },
      data: { jwtToken: newToken }
    });

    res.json({ token: newToken });
  });
} 