import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';
import { users } from '../lib/schema.js';
import { eq, or } from 'drizzle-orm';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password, appleId } = req.body;

    if (!username && !appleId) {
      return res.status(400).json({ error: 'Username or Apple ID is required' });
    }

    if (username && !password) {
      return res.status(400).json({ error: 'Password is required for username login' });
    }

    // Find user by username or Apple ID
    let user;
    if (username) {
      user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    } else {
      user = await db.select().from(users).where(eq(users.appleId, appleId)).limit(1);
    }

    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = user[0];

    // For Apple ID login, skip password check
    if (username && password) {
      // Check password for traditional login
      const isValidPassword = await bcrypt.compare(password, userData.password || '');
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userData.id,
        username: userData.username,
        appleId: userData.appleId,
      },
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

// Apple Sign In route
router.post('/apple-auth', async (req, res) => {
  try {
    const { code, id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the Apple ID token
    const applePublicKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

    const { payload } = await jwtVerify(id_token, applePublicKeys, {
      issuer: 'https://appleid.apple.com',
      audience: config.apple.clientId,
    });

    const appleUserId = payload.sub as string;
    const email = payload.email as string | undefined;
    const emailVerified = payload.email_verified as boolean | undefined;

    if (!appleUserId) {
      return res.status(400).json({ error: 'Invalid Apple ID token' });
    }

    // Check if user already exists
    let user = await db.select().from(users).where(eq(users.appleId, appleUserId)).limit(1);

    if (user.length === 0) {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          appleId: appleUserId,
          email: email || null,
          username: email ? email.split('@')[0] : `user_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      user = [newUser];
      logger.info('Created new user via Apple Sign In:', { appleUserId, email });
    }

    const userData = user[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userData.id,
        username: userData.username,
        appleId: userData.appleId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry } as jwt.SignOptions,
    );

    // Update user's JWT token in database
    await db
      .update(users)
      .set({
        jwtToken: token,
        updatedAt: new Date().toISOString(),
        email: email || userData.email, // Update email if provided
      })
      .where(eq(users.id, userData.id));

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = userData;
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error('Apple Sign In error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
