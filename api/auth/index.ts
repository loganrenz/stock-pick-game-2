import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';
import { users } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year

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
    case 'login':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await db.query.users.findFirst({
          where: eq(users.username, username)
        });
        if (!user || !user.password) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        await db.update(users).set({ jwtToken: token }).where(eq(users.id, user.id));
        return res.status(200).json({
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'logout':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        await db.update(users).set({ jwtToken: null }).where(eq(users.id, decoded.userId));
        return res.status(200).json({ message: 'Logged out successfully' });
      } catch (error) {
        console.error('Logout error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

    case 'refresh-token':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        await db.update(users).set({ jwtToken: newToken }).where(eq(users.id, decoded.userId));
        return res.status(200).json({ token: newToken });
      } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

    case 'me':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.userId)
        });
        if (!user || user.jwtToken !== token) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(200).json({
          id: user.id,
          username: user.username
        });
      } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

    default:
      return res.status(404).json({ error: 'Not found' });
  }
} 