import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 4556;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  res.json({ username: user.username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Protected routes
app.get('/api/users', requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
    },
  });
  res.json(users);
});

app.get('/api/weeks', async (req, res) => {
  const weeks = await prisma.week.findMany({
    include: {
      picks: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
      winner: {
        select: {
          username: true,
        },
      },
    },
  });
  res.json(weeks);
});

app.post('/api/picks', requireAuth, async (req, res) => {
  const { weekId, symbol, priceAtPick } = req.body;
  if (typeof req.session.userId !== 'number') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const pick = await prisma.pick.create({
    data: {
      weekId,
      userId: req.session.userId,
      symbol,
      priceAtPick,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });
  res.json(pick);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
}); 