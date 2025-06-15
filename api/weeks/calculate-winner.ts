import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { weekId } = req.body;

    if (!weekId) {
      return res.status(400).json({ error: 'Week ID is required' });
    }

    try {
      const week = await prisma.week.findUnique({
        where: { id: weekId },
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

      // Calculate current prices and returns
      const picksWithReturns = await Promise.all(
        week.picks.map(async (pick) => {
          const currentPrice = await getCurrentPrice(pick.symbol);
          if (!currentPrice) {
            return { ...pick, return: 0 };
          }
          const returnPercentage = ((currentPrice - pick.price) / pick.price) * 100;
          return { ...pick, return: returnPercentage };
        })
      );

      // Find winner
      const winner = picksWithReturns.reduce((prev, current) => 
        (current.return > prev.return) ? current : prev
      );

      // Update week with winner
      const updatedWeek = await prisma.week.update({
        where: { id: weekId },
        data: {
          winnerId: winner.userId
        },
        include: {
          picks: {
            include: {
              user: true
            }
          },
          winner: true
        }
      });

      res.json(updatedWeek);
    } catch (error) {
      console.error('Error calculating winner:', error);
      res.status(500).json({ error: 'Failed to calculate winner' });
    }
  });
}

async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const quote = response.data['Global Quote'];
    if (!quote) {
      return null;
    }

    return parseFloat(quote['05. price']);
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
} 