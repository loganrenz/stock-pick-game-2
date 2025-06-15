import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient, User } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { addDays, startOfWeek, endOfWeek, isWeekend, isMonday, isFriday } from 'date-fns';
import { toZonedTime } from "date-fns-tz";
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'],
  // errorFormat: 'pretty'
});
const port = Number(process.env.PORT) || 4556;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year
const JWT_REFRESH_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const ALPHA_VANTAGE_API_KEY = 'J135CCG2DDOQOM6D';

// Ensure logs directory exists
const logsDir = '/data/logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logging
const logStream = fs.createWriteStream(path.join(logsDir, 'api_server.log'), { flags: 'a' });
const logToFile = (message: string) => {
  const timestamp = new Date().toISOString();
  logStream.write(`${timestamp} - ${message}\n`);
};

// Update console.log calls to also log to file
console.log = (...args) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logToFile(message);
  process.stdout.write(message + '\n');
};

console.error = (...args) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logToFile(`ERROR: ${message}`);
  process.stderr.write(message + '\n');
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// JWT middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; exp: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.jwtToken !== token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if token needs refresh (if less than 30 days until expiry)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < JWT_REFRESH_THRESHOLD / 1000) {
      const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      await prisma.user.update({
        where: { id: user.id },
        data: { jwtToken: newToken }
      });
      res.setHeader('X-New-Token', newToken);
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/login', async (req: Request, res: Response) => {
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

  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  
  // Update user's JWT token
  await prisma.user.update({
    where: { id: user.id },
    data: { jwtToken: token }
  });

  res.json({ token, username: user.username });
});

app.post('/api/logout', requireAuth, async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { jwtToken: null }
  });
  res.json({ message: 'Logged out successfully' });
});

// Add token refresh endpoint
app.post('/api/refresh-token', requireAuth, async (req: Request, res: Response) => {
  const newToken = jwt.sign({ userId: req.user!.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { jwtToken: newToken }
  });

  res.json({ token: newToken });
});

// Get current user info
app.get('/api/me', requireAuth, async (req: Request, res: Response) => {
  res.json({
    id: req.user!.id,
    username: req.user!.username
  });
});

// Get current week's picks
app.get('/api/weeks/current', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

    let currentWeek = await prisma.week.findFirst({
      where: {
        startDate: {
          lte: today
        },
        endDate: {
          gte: today
        }
      },
      include: {
        picks: {
          include: {
            user: true
          }
        },
        winner: true
      }
    });

    if (!currentWeek) {
      // Prevent duplicate week for same date range
      const existing = await prisma.week.findFirst({ 
        where: { 
          startDate: weekStart,
          endDate: weekEnd 
        }
      });
      
      const weekNumber = await calculateWeekNumber(weekStart);
      
      if (existing) {
        currentWeek = await prisma.week.update({ 
          where: { id: existing.id }, 
          data: { weekNum: weekNumber },
          include: {
            picks: {
              include: {
                user: true
              }
            },
            winner: true
          }
        });
      } else {
        currentWeek = await prisma.week.create({
          data: {
            weekNum: weekNumber,
            startDate: weekStart,
            endDate: weekEnd
          },
          include: {
            picks: {
              include: {
                user: true
              }
            },
            winner: true
          }
        });
      }
    }

    // If it's weekend, calculate winners
    if (isWeekend(today) && !currentWeek.winner) {
      const picks = await prisma.pick.findMany({
        where: { weekId: currentWeek.id },
        include: { user: true }
      });

      let winningPick = null;
      let bestReturn = -Infinity;

      for (const pick of picks) {
        if (pick.returnPercentage && pick.returnPercentage > bestReturn) {
          bestReturn = pick.returnPercentage;
          winningPick = pick;
        }
      }

      if (winningPick) {
        currentWeek = await prisma.week.update({
          where: { id: currentWeek.id },
          data: { winnerId: winningPick.userId },
          include: {
            picks: {
              include: {
                user: true
              }
            },
            winner: true
          }
        });
      }
    }

    // Update daily prices for all picks
    for (const pick of currentWeek.picks) {
      if (!pick.dailyPriceData && currentWeek.startDate && currentWeek.endDate) {
        const dailyPrices = await getDailyCandles(pick.symbol, currentWeek.startDate, currentWeek.endDate);
        const formattedPrices = buildDailyPriceData(dailyPrices, currentWeek.startDate);
        
        await prisma.pick.update({
          where: { id: pick.id },
          data: {
            dailyPriceData: JSON.stringify(formattedPrices)
          }
        });
      }
    }

    res.json(currentWeek);
  } catch (error) {
    console.error('Error in /api/weeks/current:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all weeks with picks
app.get('/api/weeks', async (req: Request, res: Response) => {
  try {
    const weeks = await prisma.week.findMany({
      include: {
        picks: {
          include: {
            user: true
          }
        },
        winner: true
      },
      orderBy: {
        weekNum: 'desc'
      }
    });

    // Parse dailyPrices for all picks before sending to frontend
    for (const week of weeks) {
      for (const pick of week.picks) {
        pick.dailyPriceData = pick.dailyPriceData ? JSON.parse(pick.dailyPriceData) : {};
      }
    }

    res.json(weeks);
  } catch (error: unknown) {
    console.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: get US market close time for Friday (4:30pm ET)
function getFridayCloseET(date = new Date()) {
  const zone = 'America/New_York';
  const friday = startOfWeek(toZonedTime(date, zone), { weekStartsOn: 1 });
  friday.setDate(friday.getDate() + 4); // Friday
  friday.setHours(16, 30, 0, 0); // 4:30pm ET
  return toZonedTime(friday, zone);
}

// Helper: get Sunday midnight ET
function getSundayMidnightET(date = new Date()) {
  const zone = 'America/New_York';
  const sunday = startOfWeek(toZonedTime(date, zone), { weekStartsOn: 1 });
  sunday.setDate(sunday.getDate() + 7); // Next Monday 00:00 ET
  sunday.setHours(0, 0, 0, 0);
  return toZonedTime(sunday, zone);
}

// Utility: Calculate weekNumber based on the number of weeks since the first week in the DB
async function calculateWeekNumber(startDate: Date): Promise<number> {
  const firstWeek = await prisma.week.findFirst({ orderBy: { startDate: 'asc' } });
  if (!firstWeek) return 1;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = startOfWeek(startDate, { weekStartsOn: 1 }).getTime() - startOfWeek(new Date(firstWeek.startDate), { weekStartsOn: 1 }).getTime();
  return 1 + Math.round(diff / msPerWeek);
}

// Get or create next available week
async function createNextWeekIfNeeded() {
  try {
    const today = new Date();
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

    let nextWeek = await prisma.week.findFirst({
      where: {
        startDate: nextWeekStart,
        endDate: nextWeekEnd
      },
      include: {
        picks: {
          include: {
            user: true
          }
        }
      }
    });

    if (!nextWeek) {
      const weekNumber = await calculateWeekNumber(nextWeekStart);
      nextWeek = await prisma.week.create({
        data: {
          weekNum: weekNumber,
          startDate: nextWeekStart,
          endDate: nextWeekEnd
        },
        include: {
          picks: {
            include: {
              user: true
            }
          }
        }
      });

      // Rollover picks for the new week
      if (nextWeek) {
        await copyLastWeekPicks(nextWeek.id);
      }
    }

    return nextWeek;
  } catch (error) {
    console.error('Error getting/creating next week:', error);
    return null;
  }
}

// Rollover picks for a week
async function copyLastWeekPicks(weekId: number) {
  try {
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        picks: true
      }
    });

    if (!week || !week.startDate) {
      throw new Error('Week not found or invalid');
    }

    // Get all users
    const users = await prisma.user.findMany({
      where: {
        username: {
          in: ['patrick', 'taylor', 'logan']
        }
      }
    });

    // For each user, check if they have a pick for this week
    for (const user of users) {
      const existingPick = week.picks.find(pick => pick.userId === user.id);
      
      if (!existingPick) {
        // Find the user's last pick
        const lastPick = await prisma.pick.findFirst({
          where: {
            userId: user.id,
            week: {
              endDate: {
                lt: week.startDate
              }
            }
          },
          orderBy: {
            week: {
              startDate: 'desc'
            }
          }
        });

        if (lastPick) {
          // Create a new pick with the same symbol
          const currentPrice = await getCurrentPrice(lastPick.symbol);
          if (currentPrice !== null) {
            await prisma.pick.create({
              data: {
                userId: user.id,
                weekId: week.id,
                symbol: lastPick.symbol,
                entryPrice: currentPrice,
                dailyPriceData: lastPick.dailyPriceData,
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error rolling over picks:', error);
  }
}

if (process.env.NODE_ENV !== 'test') {
  // Schedule: rollover picks for new week every Monday at 00:05 UTC
  setInterval(async () => {
    const now = new Date();
    if (now.getUTCDay() === 1 && now.getUTCHours() === 0 && now.getUTCMinutes() < 10) {
      // Find the latest week
      const latestWeek = await prisma.week.findFirst({ orderBy: { weekNum: 'desc' } });
      if (latestWeek) {
        await copyLastWeekPicks(latestWeek.id);
      }
    }
  }, 5 * 60 * 1000);

  // Schedule: check every 5 minutes
  setInterval(async () => {
    await createNextWeekIfNeeded();
    await backfillMissingPicks();
  }, 5 * 60 * 1000);
}

// Helper: backfill missing picks for past weeks
async function backfillMissingPicks() {
  const users = await prisma.user.findMany();
  const weeks = await prisma.week.findMany({ orderBy: { weekNum: 'asc' }, include: { picks: true } });
  for (let i = 1; i < weeks.length; i++) {
    const prevWeek = weeks[i - 1];
    const week = weeks[i];
    for (const user of users) {
      const hasPick = week.picks.find(p => p.userId === user.id);
      if (!hasPick) {
        const prevPick = prevWeek.picks.find(p => p.userId === user.id);
        if (prevPick) {
          await prisma.pick.create({
            data: {
              weekId: week.id,
              userId: user.id,
              symbol: prevPick.symbol,
              entryPrice: prevPick.entryPrice,
              dailyPriceData: prevPick.dailyPriceData,
            }
          });
        }
      }
    }
  }
}

// Utility endpoint to force backfill all missing picks for all weeks
app.post('/api/backfill-all-picks', async (req, res) => {
  try {
    await backfillMissingPicks();
    res.json({ message: 'Backfill complete' });
  } catch (error) {
    res.status(500).json({ error: 'Backfill failed' });
  }
});

// Get current price for a stock
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });
    const data = response.data as Record<string, any>;
    const quote = data['Global Quote'] as { '05. price': string } | undefined;
    if (!quote || !quote['05. price']) {
      return null;
    }
    return parseFloat(quote['05. price']);
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
}

// Get daily candles for a stock
async function getDailyCandles(symbol: string, from: Date, to: Date): Promise<{ [key: string]: { open: string; close: string } }> {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
        outputsize: 'compact'
      }
    });
    const data = response.data as Record<string, any>;
    const timeSeriesData = data['Time Series (Daily)'] as { [key: string]: { '1. open': string; '4. close': string } } | undefined;
    if (!timeSeriesData) {
      throw new Error('No time series data available');
    }
    const result: { [key: string]: { open: string; close: string } } = {};
    const dates = Object.keys(timeSeriesData).sort();
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let closestDate = dates.find(date => date <= dateStr);
      if (!closestDate && dates.length > 0) {
        closestDate = dates[dates.length - 1];
      }
      if (closestDate && timeSeriesData[closestDate]) {
        result[dateStr] = {
          open: timeSeriesData[closestDate]['1. open'],
          close: timeSeriesData[closestDate]['4. close']
        };
      }
    }
    return result;
  } catch (error) {
    console.error('Error fetching daily candles:', error);
    return {};
  }
}

// Build daily prices object
function buildDailyPriceData(history: { [key: string]: { open: string; close: string } }, weekStart: Date): { [key: string]: { open: string | null; close: string | null } } {
  const result: { [key: string]: { open: string | null; close: string | null } } = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (history[dateStr]) {
      result[days[i]] = {
        open: history[dateStr].open,
        close: history[dateStr].close
      };
    } else {
      // If no data for this day, use the previous day's close as both open and close
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      
      if (history[prevDateStr]) {
        result[days[i]] = {
          open: history[prevDateStr].close,
          close: history[prevDateStr].close
        };
      } else {
        result[days[i]] = {
          open: null,
          close: null
        };
      }
    }
  }
  
  return result;
}

// Submit a pick for the current week
app.post('/api/picks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { symbol, weekId } = req.body;
    const userId = req.user!.id;

    // Validate the week exists and is current/next
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        picks: {
          include: {
            user: true
          }
        }
      }
    });

    if (!week || !week.endDate) {
      return res.status(404).json({ error: 'Week not found or invalid' });
    }

    const now = new Date();
    const weekEnd = new Date(week.endDate);
    if (now > weekEnd) {
      return res.status(400).json({ error: 'Cannot submit pick for past week' });
    }

    // Get current price
    const currentPrice = await getCurrentPrice(symbol);
    if (currentPrice === null) {
      return res.status(400).json({ error: 'Invalid stock symbol' });
    }

    // Check if user already has a pick for this week
    const existingPick = await prisma.pick.findFirst({
      where: {
        userId,
        weekId
      }
    });

    if (existingPick) {
      // Update existing pick
      const updatedPick = await prisma.pick.update({
        where: { id: existingPick.id },
        data: {
          symbol,
          dailyPriceData: null, // Reset daily prices to be updated later
          currentValue: null,
          returnPercentage: null
        },
        include: {
          user: true
        }
      });
      res.json(updatedPick);
    } else {
      // Create new pick
      const newPick = await prisma.pick.create({
        data: {
          userId,
          weekId,
          symbol,
          entryPrice: currentPrice
        },
        include: {
          user: true
        }
      });
      res.json(newPick);
    }
  } catch (error) {
    console.error('Error submitting pick:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit pick for next week
app.post('/api/weeks/next/picks', requireAuth, async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { symbol } = req.body;
    const today = new Date();
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addDays(today, 7), { weekStartsOn: 1 });

    let nextWeek = await prisma.week.findFirst({
      where: {
        startDate: nextWeekStart,
        endDate: nextWeekEnd
      },
      include: {
        picks: {
          include: {
            user: true
          }
        }
      }
    });

    if (!nextWeek) {
      // Prevent duplicate week for same date range
      const existing = await prisma.week.findFirst({ where: { startDate: nextWeekStart, endDate: nextWeekEnd } });
      const weekNumber = await calculateWeekNumber(nextWeekStart);
      if (existing) {
        nextWeek = await prisma.week.update({ 
          where: { id: existing.id }, 
          data: { weekNum: weekNumber },
          include: {
            picks: {
              include: {
                user: true
              }
            }
          }
        });
      } else {
        nextWeek = await prisma.week.create({
          data: {
            weekNum: weekNumber,
            startDate: nextWeekStart,
            endDate: nextWeekEnd
          },
          include: {
            picks: {
              include: {
                user: true
              }
            }
          }
        });
      }
    }

    if (!nextWeek) {
      return res.status(500).json({ error: 'Could not create or find next week' });
    }

    // Check if user already has a pick for next week
    const existingPick = await prisma.pick.findFirst({
      where: {
        userId: user.id,
        weekId: nextWeek.id
      }
    });

    // Get current price and daily prices
    const price = await getCurrentPrice(symbol);
    if (price === null) {
      return res.status(400).json({ error: 'Invalid stock symbol' });
    }
    const history = await getDailyCandles(symbol, nextWeekStart, nextWeekEnd);
    const dailyPriceData: Record<string, { open: string | null; close: string | null }> = buildDailyPriceData(history, nextWeekStart);

    if (existingPick) {
      // Update existing pick
      const pick = await prisma.pick.update({
        where: { id: existingPick.id },
        data: {
          symbol,
          entryPrice: price,
          dailyPriceData: JSON.stringify(dailyPriceData)
        },
        include: {
          user: true
        }
      });
      res.json(pick);
    } else {
      // Create new pick
      const pick = await prisma.pick.create({
        data: {
          userId: user.id,
          weekId: nextWeek.id,
          symbol,
          entryPrice: price,
          dailyPriceData: JSON.stringify(dailyPriceData)
        },
        include: {
          user: true
        }
      });
      res.json(pick);
    }
  } catch (error: unknown) {
    console.error('Error submitting next week pick:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to force-create the next week
app.post('/api/weeks/next/create', async (req, res) => {
  try {
    const today = new Date();
    const nextMonday = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextSunday = endOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    let week = await prisma.week.findFirst({
      where: {
        startDate: nextMonday,
        endDate: nextSunday
      },
      include: { picks: { include: { user: true } } }
    });
    if (!week) {
      const weekNumber = await calculateWeekNumber(nextMonday);
      week = await prisma.week.create({
        data: {
          weekNum: weekNumber,
          startDate: nextMonday,
          endDate: nextSunday
        },
        include: { picks: { include: { user: true } } }
      });
    }
    res.json(week);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create next week' });
  }
});

// Update daily prices (to be called by a cron job)
app.post('/api/update-prices', async (req, res) => {
  try {
    const today = new Date();
    if (isWeekend(today)) {
      return res.json({ message: 'No updates on weekends' });
    }
    const week = await prisma.week.findFirst({
      where: {
        startDate: {
          lte: today
        },
        endDate: {
          gte: today
        }
      },
      include: {
        picks: true
      }
    });
    if (!week) {
      return res.json({ message: 'No active week found' });
    }
    const FMP_API_KEY = process.env.FMP_API_KEY || 'NMxvgvIlePZYlyhQTOtKcxtvTv1jv9Og';
    const dayOfWeek = today.getDay();
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    for (const pick of week.picks) {
      try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${pick.symbol}?apikey=${FMP_API_KEY}`);
        const dataArr = response.data as Array<{ open: number; price: number }>;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const data = dataArr[0];
          let dailyPrices: Record<string, { open: number; close: number }> = {};
          try {
            dailyPrices = pick.dailyPriceData ? JSON.parse(pick.dailyPriceData) : {};
          } catch (e) {
            dailyPrices = {};
          }
          dailyPrices[dayKey] = {
            open: Number(data.open),
            close: Number(data.price)
          };
          const updateData: any = {
            dailyPriceData: JSON.stringify(dailyPrices),
            currentValue: Number(data.price)
          };
          if (typeof pick.entryPrice === 'number') {
            updateData.returnPercentage = pick.entryPrice !== 0 ? ((Number(data.price) - pick.entryPrice) / pick.entryPrice) * 100 : 0;
          }
          await prisma.pick.update({
            where: { id: pick.id },
            data: updateData
          });
        }
      } catch (error) {
        console.error(`Error updating price for ${pick.symbol}:`, error);
      }
    }
    res.json({ message: 'Prices updated successfully' });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scoreboard endpoint: returns win count for each user
app.get('/api/scoreboard', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { wins: true } });
    const scoreboard = users.map(u => ({
      username: u.username,
      wins: u.wins.length
    }));
    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scoreboard' });
  }
});

// Utility: Backfill daily open/close prices for all picks using FMP API
app.post('/api/backfill-daily-prices', async (req, res) => {
  try {
    const picks = await prisma.pick.findMany({ include: { week: true } });
    const FMP_API_KEY = process.env.FMP_API_KEY || 'NMxvgvIlePZYlyhQTOtKcxtvTv1jv9Og';
    for (const pick of picks) {
      const weekStart = new Date(pick.week.startDate);
      // Get all daily candles for the week (Mon-Fri)
      const symbol = pick.symbol;
      const from = weekStart.toISOString().slice(0, 10);
      const to = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const history = await getDailyCandles(symbol, new Date(from), new Date(to));
      // Map by date for easy lookup
      const priceByDate: Record<string, { open: number; close: number }> = {};
      for (const [date, data] of Object.entries(history)) {
        priceByDate[date] = { open: Number(data.open), close: Number(data.close) };
      }
      // Build dailyPrices for Mon-Fri
      const dailyPrices: Record<string, { open: number | null; close: number | null }> = {};
      let lastValid = null;
      for (let i = 0; i < 5; i++) {
        const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        let day = priceByDate[dateStr];
        if (!day && lastValid) {
          // Holiday: use previous day's open/close
          dailyPrices[['monday','tuesday','wednesday','thursday','friday'][i]] = { open: lastValid.open, close: lastValid.close };
        } else if (day) {
          dailyPrices[['monday','tuesday','wednesday','thursday','friday'][i]] = { open: day.open, close: day.close };
          lastValid = day;
        } else {
          // No data at all, leave as null
          dailyPrices[['monday','tuesday','wednesday','thursday','friday'][i]] = { open: null, close: null };
        }
      }
      await prisma.pick.update({
        where: { id: pick.id },
        data: { dailyPriceData: JSON.stringify(dailyPrices) }
      });
    }
    res.json({ message: 'Backfill complete' });
  } catch (error) {
    console.error('Backfill error:', error);
    res.status(500).json({ error: 'Backfill failed' });
  }
});

// Stats endpoint: returns all picks, users, and weeks for stats calculations
app.get('/api/stats', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const weeks = await prisma.week.findMany({ include: { picks: { include: { user: true } }, winner: true } });
    const picks = await prisma.pick.findMany({ include: { user: true, week: true } });
    res.json({ users, weeks, picks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats data' });
  }
});

// New: API endpoint to get the next week for picks (or null if not in pick window)
app.get('/api/next-week', async (req, res) => {
  try {
    const now = new Date();
    // Use today to determine the current week, then get the next week
    const thisMonday = startOfWeek(now, { weekStartsOn: 1 });
    const nextMonday = startOfWeek(addDays(thisMonday, 7), { weekStartsOn: 1 });
    const nextSundayMidnight = getSundayMidnightET(thisMonday);

    // Always get or create the next week
    let nextWeek = await prisma.week.findFirst({
      where: { startDate: nextMonday },
      include: { picks: { include: { user: true } } }
    });

    if (!nextWeek) {
      console.log('Next week not found, creating new week');
      const weekNum = await calculateWeekNumber(nextMonday);
      nextWeek = await prisma.week.create({
        data: {
          weekNum,
          startDate: nextMonday,
          endDate: endOfWeek(nextMonday, { weekStartsOn: 1 })
        },
        include: { picks: { include: { user: true } } }
      });
    } else {
      console.log('Next week found:', nextWeek);
    }

    // Add editable flag based on current time
    const isEditable = now < nextSundayMidnight;

    return res.json({
      ...nextWeek,
      editable: isEditable
    });
  } catch (error) {
    console.error('Error in /api/next-week:', error);
    res.status(500).json({ error: 'Failed to get next week' });
  }
});

// On backend start, ensure next week is created if pick window is open
(async () => {
  const now = new Date();
  let latestWeek = await prisma.week.findFirst({ orderBy: { weekNum: 'desc' } });
  if (latestWeek) {
    const fridayClose = getFridayCloseET(new Date(latestWeek.startDate));
    const nextMonday = startOfWeek(addDays(new Date(latestWeek.startDate), 7), { weekStartsOn: 1 });
    const nextSundayMidnight = getSundayMidnightET(new Date(latestWeek.startDate));
    let nextWeek = await prisma.week.findFirst({ where: { startDate: nextMonday } });
    if (!nextWeek && now >= fridayClose && now < nextSundayMidnight) {
      const weekNum = await calculateWeekNumber(nextMonday);
      await prisma.week.create({
        data: {
          weekNum,
          startDate: nextMonday,
          endDate: endOfWeek(nextMonday, { weekStartsOn: 1 })
        }
      });
    }
  }
})();

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;