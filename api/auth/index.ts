import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../../api-helpers/lib/db.js';
import { users } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { config } from '../../api-helpers/lib/config.js';
import cookie from 'cookie';

const JWT_SECRET = config.jwt.secret as jwt.Secret;
const JWT_EXPIRY = '180d'; // Access token expires in 15 minutes
const REFRESH_TOKEN_SECRET = config.jwt.secret + '_refresh';
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token expires in 7 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
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
          where: eq(users.username, username),
        });
        if (!user || !user.password) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
          expiresIn: REFRESH_TOKEN_EXPIRY,
        });
        await db.update(users).set({ jwtToken: refreshToken }).where(eq(users.id, user.id));

        res.setHeader(
          'Set-Cookie',
          cookie.serialize('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          }),
        );

        return res.status(200).json({
          token: accessToken,
          user: {
            id: user.id,
            username: user.username,
          },
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

        res.setHeader(
          'Set-Cookie',
          cookie.serialize('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            expires: new Date(0),
            path: '/',
          }),
        );

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
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
          return res.status(401).json({ error: 'No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: number };

        const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) });

        if (!user || user.jwtToken !== refreshToken) {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, {
          expiresIn: JWT_EXPIRY,
        });

        return res.status(200).json({ token: newAccessToken });
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
          where: eq(users.id, decoded.userId),
        });
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(200).json({
          id: user.id,
          username: user.username,
        });
      } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

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
          where: eq(users.username, username),
        });
        if (existingUser) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const inserted = await db
          .insert(users)
          .values({ username, password: hashedPassword })
          .returning();
        const user = inserted[0];
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        await db.update(users).set({ jwtToken: token }).where(eq(users.id, user.id));
        return res.status(201).json({
          token,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'verify':
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
          where: eq(users.id, decoded.userId),
        });
        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(200).json({ user: { id: user.id, username: user.username } });
      } catch (error) {
        console.error('Verify error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

    default:
      return res.status(404).json({ error: 'Not found' });
  }
}
