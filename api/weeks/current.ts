import { NextApiRequest, NextApiResponse } from 'next';
import { startOfWeek, endOfWeek } from 'date-fns';
import { prisma } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

      const currentWeek = await prisma.week.findFirst({
        where: {
          startDate: {
            lte: today
          },
          endDate: {
            gte: today
          }
        },
        include: {
          picks: {
            include: {
              user: true
            }
          }
        }
      });

      if (!currentWeek) {
        // Create new week if none exists
        const newWeek = await prisma.week.create({
          data: {
            startDate: weekStart,
            endDate: weekEnd,
            weekNumber: await calculateWeekNumber(weekStart)
          },
          include: {
            picks: {
              include: {
                user: true
              }
            }
          }
        });
        return res.json(newWeek);
      }

      res.json(currentWeek);
    } catch (error) {
      console.error('Error fetching current week:', error);
      res.status(500).json({ error: 'Failed to fetch current week' });
    }
  });
}

async function calculateWeekNumber(startDate: Date): Promise<number> {
  const firstWeek = await prisma.week.findFirst({
    orderBy: {
      startDate: 'asc'
    }
  });

  if (!firstWeek) {
    return 1;
  }

  const weeks = await prisma.week.count({
    where: {
      startDate: {
        lte: startDate
      }
    }
  });

  return weeks + 1;
} 