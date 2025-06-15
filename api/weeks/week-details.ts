import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Week ID is required' });
    }

    try {
      const week = await prisma.week.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          picks: {
            include: {
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