import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateStockPrices } from '../../api-helpers/cron/update-stock-prices.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (Vercel cron jobs use GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobType = req.query.job as string;

  try {
    switch (jobType) {
      case 'update-stock-prices':
        const result = await updateStockPrices();
        return res.status(200).json(result);

      default:
        return res.status(400).json({ error: 'Invalid job type' });
    }
  } catch (error) {
    console.error('[cron] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
