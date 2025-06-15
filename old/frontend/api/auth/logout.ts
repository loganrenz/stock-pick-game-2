import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    await prisma.user.update({
      where: { id: (req as AuthenticatedRequest).user!.id },
      data: { jwtToken: null }
    });
    res.json({ message: 'Logged out successfully' });
  });
} 