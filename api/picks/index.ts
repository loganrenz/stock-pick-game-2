import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { weekId, symbol, price } = req.body;
    const userId = (req as AuthenticatedRequest).user!.id;

    if (!weekId || !symbol || !price) {
      return res.status(400).json({ error: 'Week ID, symbol, and price are required' });
    }

    try {
      // Check if week exists and is current week
      const week = await prisma.week.findUnique({
        where: { id: weekId }
      });

      if (!week) {
        return res.status(404).json({ error: 'Week not found' });
      }

      const now = new Date();
      if (now < week.startDate || now > week.endDate) {
        return res.status(400).json({ error: 'Cannot make picks outside of current week' });
      }

      // Check if user already has a pick for this week
      const existingPick = await prisma.pick.findFirst({
        where: {
          weekId,
          userId
        }
      });

      if (existingPick) {
        // Update existing pick
        const updatedPick = await prisma.pick.update({
          where: { id: existingPick.id },
          data: {
            symbol,
            price: parseFloat(price)
          }
        });
        return res.json(updatedPick);
      }

      // Create new pick
      const newPick = await prisma.pick.create({
        data: {
          weekId,
          userId,
          symbol,
          price: parseFloat(price)
        }
      });

      res.json(newPick);
    } catch (error) {
      console.error('Error creating/updating pick:', error);
      res.status(500).json({ error: 'Failed to create/update pick' });
    }
  });
} 