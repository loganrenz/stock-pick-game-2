import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production' });
  }

  try {
    // Run migration
    const migrate = await import('../../lib/migrate.js');
    await migrate.main();

    // Run seed
    const seed = await import('../../lib/seed.js');
    await seed.main();

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
} 