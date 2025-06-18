import type { VercelRequest, VercelResponse } from '@vercel/node';
import migrate from '../../api-helpers/lib/migrate.js';
import seed  from '../../api-helpers/lib/seed.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract path segment robustly (ignore query string)
  const path = req.url?.split('?')[0].split('/').pop() || '';

  switch (path) {
    case 'setup':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        await migrate();
        await seed();
        return res.status(200).json({ message: 'Test setup completed' });
      } catch (error) {
        console.error('Test setup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'cleanup':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        // Implement test cleanup logic here
        return res.status(200).json({ message: 'Test cleanup completed' });
      } catch (error) {
        console.error('Test cleanup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      return res.status(404).json({ error: 'Not found' });
  }
} 