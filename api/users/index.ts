import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { users } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';

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

  const path = req.url?.split('/').pop() || '';

  switch (path) {
    case 'register':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required' });
        }
        const existingUser = await db.query.users.findFirst({
          where: eq(users.username, username)
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await db.insert(users).values({
          username,
          password: hashedPassword
        }).returning();
        return res.status(201).json({
          id: newUser.id,
          username: newUser.username
        });
      } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'profile':
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, (req as AuthenticatedRequest).user!.id)
          });
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          return res.status(200).json({
          id: user.id,
            username: user.username
          });
    } catch (error) {
          console.error('Profile error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    default:
      return res.status(404).json({ error: 'Not found' });
    }
} 