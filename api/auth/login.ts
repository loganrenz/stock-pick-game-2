import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { JWT_SECRET, JWT_EXPIRY } from '../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In a real application, you should use bcrypt or similar to hash passwords
    // For now, we'll do a simple comparison
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Store the token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { jwtToken: token }
    });

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
} 