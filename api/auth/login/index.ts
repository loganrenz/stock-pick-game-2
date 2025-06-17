import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../../lib/db.js';
import { users } from '../../lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  console.log('Login request received');
  console.log('DB URL:', process.env.TURSO_DB_URL);
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    console.log('username type:', typeof username, 'value:', username);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Attempting to find user in database...');
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    console.log('Query result:', user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    let updateResult;
    try {
      updateResult = await db.update(users)
        .set({ jwtToken: token })
        .where(eq(users.id, user.id));
      console.log('Update result:', updateResult);
    } catch (updateError) {
      console.error('Error updating jwtToken in DB:', updateError);
    }

    // Fetch user again to check jwtToken
    const userAfterUpdate = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    console.log('User after update:', userAfterUpdate);

    console.log('Token issued with expiration:', JWT_EXPIRY);
    console.log('Token payload:', { userId: user.id, exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
} 