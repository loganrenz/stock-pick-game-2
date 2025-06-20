import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';
import { users } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = user[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, userData.password || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, username: userData.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry } as jwt.SignOptions,
    );

    // Update user's JWT token in database
    await db
      .update(users)
      .set({ jwtToken: token, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userData.id));

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = userData;
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Clear JWT token from database
      await db
        .update(users)
        .set({ jwtToken: null, updatedAt: new Date().toISOString() })
        .where(eq(users.jwtToken, token));
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Find user by JWT token
    const user = await db.select().from(users).where(eq(users.jwtToken, token)).limit(1);

    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user[0];
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify current token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Find user
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userData = user[0];

    // Generate new token
    const newToken = jwt.sign(
      { userId: userData.id, username: userData.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry } as jwt.SignOptions,
    );

    // Update user's JWT token in database
    await db
      .update(users)
      .set({ jwtToken: newToken, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userData.id));

    res.json({ token: newToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
