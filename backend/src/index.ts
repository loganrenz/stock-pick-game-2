import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { addDays, startOfWeek, endOfWeek, isWeekend, isMonday, isFriday } from 'date-fns';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 4556;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '365d'; // 1 year
const ALPHA_VANTAGE_API_KEY = 'J135CCG2DDOQOM6D';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// JWT middleware
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.jwtToken !== token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
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

  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  
  // Update user's JWT token
  await prisma.user.update({
    where: { id: user.id },
    data: { jwtToken: token }
  });

  res.json({ token, username: user.username });
});

app.post('/api/logout', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { jwtToken: null }
  });
  res.json({ message: 'Logged out successfully' });
});

// Get current week's picks
app.get('/api/current-week', async (req, res) => {
  try {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday

    let week = await prisma.week.findFirst({
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

    if (!week) {
      // Create new week if it doesn't exist
      week = await prisma.week.create({
        data: {
          weekNum: Math.ceil((today.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
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

    // If it's weekend, calculate winners
    if (isWeekend(today) && !week.winner) {
      const picks = await prisma.pick.findMany({
        where: { weekId: week.id },
        include: { user: true }
      });

      let bestPick = null;
      let bestReturn = -Infinity;

      for (const pick of picks) {
        if (pick.weekReturnPct && pick.weekReturnPct > bestReturn) {
          bestReturn = pick.weekReturnPct;
          bestPick = pick;
        }
      }

      if (bestPick) {
        week = await prisma.week.update({
          where: { id: week.id },
          data: { winnerId: bestPick.userId },
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

    // Parse dailyPrices for all picks before sending to frontend
    for (const pick of week.picks) {
      pick.dailyPrices = pick.dailyPrices ? JSON.parse(pick.dailyPrices) : {};
    }

    res.json(week);
  } catch (error) {
    console.error('Error fetching current week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all weeks with picks
app.get('/api/weeks', async (req, res) => {
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
        pick.dailyPrices = pick.dailyPrices ? JSON.parse(pick.dailyPrices) : {};
      }
    }

    res.json(weeks);
  } catch (error) {
    console.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: get US market close time for Friday (4pm ET)
function getFridayClose(date = new Date()) {
  const friday = startOfWeek(date, { weekStartsOn: 1 });
  friday.setDate(friday.getDate() + 4); // Friday
  friday.setHours(20, 0, 0, 0); // 4pm ET = 20:00 UTC
  return friday;
}

// Helper: get Sunday midnight UTC
function getSundayMidnight(date = new Date()) {
  const sunday = startOfWeek(date, { weekStartsOn: 1 });
  sunday.setDate(sunday.getDate() + 6); // Sunday
  sunday.setHours(23, 59, 59, 999); // End of Sunday UTC
  return sunday;
}

// Helper: get the next available week for picks
async function getOrCreateNextAvailableWeek() {
  const today = new Date();
  // Find the latest week
  let latestWeek = await prisma.week.findFirst({ orderBy: { weekNum: 'desc' } });
  if (!latestWeek) {
    // If no week exists, create the first week
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    latestWeek = await prisma.week.create({
      data: {
        weekNum: 1,
        startDate: start,
        endDate: end
      }
    });
  }
  // If today is after the latest week's Friday close, create the next week if not already created
  const fridayClose = getFridayClose(new Date(latestWeek.startDate));
  if (today >= fridayClose) {
    const nextMonday = startOfWeek(addDays(new Date(latestWeek.startDate), 7), { weekStartsOn: 1 });
    const nextSunday = endOfWeek(addDays(new Date(latestWeek.startDate), 7), { weekStartsOn: 1 });
    let nextWeek = await prisma.week.findFirst({ where: { startDate: nextMonday, endDate: nextSunday } });
    if (!nextWeek) {
      nextWeek = await prisma.week.create({
        data: {
          weekNum: latestWeek.weekNum + 1,
          startDate: nextMonday,
          endDate: nextSunday
        }
      });
    }
    return nextWeek;
  }
  return latestWeek;
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
              priceAtPick: prevPick.priceAtPick,
              dailyPrices: prevPick.dailyPrices,
            }
          });
        }
      }
    }
  }
}

// Schedule: check every 5 minutes
setInterval(async () => {
  await getOrCreateNextAvailableWeek();
  await backfillMissingPicks();
}, 5 * 60 * 1000);

// Utility endpoint to force backfill all missing picks for all weeks
app.post('/api/backfill-all-picks', async (req, res) => {
  try {
    await backfillMissingPicks();
    res.json({ message: 'Backfill complete' });
  } catch (error) {
    res.status(500).json({ error: 'Backfill failed' });
  }
});

// Helper: get current price from FMP, fallback to Alpha Vantage
async function getCurrentPrice(symbol) {
  const FMP_API_KEY = process.env.FMP_API_KEY || 'NMxvgvIlePZYlyhQTOtKcxtvTv1jv9Og';
  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`);
    if (response.data && response.data.length > 0 && response.data[0].price) {
      return response.data[0].price;
    }
    // If FMP returns error or no data, fall through
  } catch (err) {
    if (err.response && err.response.status !== 429) throw err;
    // else, try Alpha Vantage
  }
  // Alpha Vantage fallback
  const avRes = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
  if (avRes.data && avRes.data['Global Quote'] && avRes.data['Global Quote']['05. price']) {
    return parseFloat(avRes.data['Global Quote']['05. price']);
  }
  throw new Error('No price data found');
}

// Helper: get daily candles from FMP, fallback to Alpha Vantage
async function getDailyCandles(symbol, from, to) {
  const FMP_API_KEY = process.env.FMP_API_KEY || 'NMxvgvIlePZYlyhQTOtKcxtvTv1jv9Og';
  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`);
    if (response.data && response.data.historical && response.data.historical.length > 0) {
      return response.data.historical;
    }
  } catch (err) {
    if (err.response && err.response.status !== 429) throw err;
  }
  // Alpha Vantage fallback
  const avRes = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`);
  if (avRes.data && avRes.data['Time Series (Daily)']) {
    // Convert to FMP-like format
    const candles = [];
    for (const [date, data] of Object.entries(avRes.data['Time Series (Daily)'])) {
      if (date >= from && date <= to) {
        candles.push({
          date,
          open: parseFloat(data['1. open']),
          close: parseFloat(data['4. close'])
        });
      }
    }
    return candles;
  }
  throw new Error('No daily data found');
}

// Update /api/picks/next-week to use getOrCreateNextAvailableWeek and always allow pick for next available week if window is open
app.post('/api/picks/next-week', requireAuth, async (req, res) => {
  try {
    const { symbol } = req.body;
    const today = new Date();
    const week = await getOrCreateNextAvailableWeek();
    // Only allow pick if now >= Friday close of previous week and <= Sunday midnight of this week
    const prevFridayClose = getFridayClose(addDays(new Date(week.startDate), -7));
    const thisSundayMidnight = getSundayMidnight(new Date(week.startDate));
    if (today < prevFridayClose || today > thisSundayMidnight) {
      return res.status(400).json({ error: 'Pick window for next week is closed' });
    }
    // Check if user already has a pick for this week
    let existingPick = await prisma.pick.findFirst({
      where: {
        weekId: week.id,
        userId: req.user.id
      }
    });
    const priceAtPick = await getCurrentPrice(symbol);
    if (existingPick) {
      // Update the existing pick
      existingPick = await prisma.pick.update({
        where: { id: existingPick.id },
        data: {
          symbol,
          priceAtPick,
          dailyPrices: JSON.stringify({
            monday: { open: priceAtPick, close: priceAtPick },
            tuesday: { open: null, close: null },
            wednesday: { open: null, close: null },
            thursday: { open: null, close: null },
            friday: { open: null, close: null }
          })
        },
        include: { user: true }
      });
      existingPick.dailyPrices = JSON.parse(existingPick.dailyPrices || '{}');
      return res.json(existingPick);
    }
    // Create pick for this week
    const pick = await prisma.pick.create({
      data: {
        weekId: week.id,
        userId: req.user.id,
        symbol,
        priceAtPick,
        dailyPrices: JSON.stringify({
          monday: { open: priceAtPick, close: priceAtPick },
          tuesday: { open: null, close: null },
          wednesday: { open: null, close: null },
          thursday: { open: null, close: null },
          friday: { open: null, close: null }
        })
      },
      include: { user: true }
    });
    pick.dailyPrices = JSON.parse(pick.dailyPrices || '{}');
    res.json(pick);
  } catch (error) {
    console.error('Error creating next week pick:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make a pick for the current week
app.post('/api/picks', requireAuth, async (req, res) => {
  try {
    const { symbol } = req.body;
    const today = new Date();
    const week = await prisma.week.findFirst({
      where: {
        startDate: {
          lte: today
        },
        endDate: {
          gte: today
        }
      }
    });
    if (!week) {
      // Create new week if it doesn't exist
      week = await prisma.week.create({
        data: {
          weekNum: Math.ceil((today.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate: startOfWeek(today, { weekStartsOn: 1 }),
          endDate: endOfWeek(today, { weekStartsOn: 1 })
        }
      });
      await backfillMissingPicks();
      week = await prisma.week.findFirst({
        where: { id: week.id },
        include: {
          picks: { include: { user: true } },
          winner: true
        }
      });
    }
    // Only allow pick if today is before Friday close
    const fridayClose = getFridayClose(today);
    if (today >= fridayClose) {
      return res.status(400).json({ error: 'Pick window for current week is closed' });
    }
    // Check if user already has a pick for this week
    const existingPick = await prisma.pick.findFirst({
      where: {
        weekId: week.id,
        userId: req.user.id
      }
    });
    if (existingPick) {
      return res.status(400).json({ error: 'You already have a pick for this week' });
    }
    // Get current stock price
    const priceAtPick = await getCurrentPrice(symbol);
    // Create pick
    const pick = await prisma.pick.create({
      data: {
        weekId: week.id,
        userId: req.user.id,
        symbol,
        priceAtPick,
        dailyPrices: JSON.stringify({
          monday: { open: priceAtPick, close: priceAtPick },
          tuesday: { open: null, close: null },
          wednesday: { open: null, close: null },
          thursday: { open: null, close: null },
          friday: { open: null, close: null }
        })
      },
      include: {
        user: true
      }
    });
    pick.dailyPrices = JSON.parse(pick.dailyPrices || '{}');
    res.json(pick);
  } catch (error) {
    console.error('Error creating pick:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        if (response.data && response.data.length > 0) {
          const data = response.data[0];
          let dailyPrices = {};
          try {
            dailyPrices = pick.dailyPrices ? JSON.parse(pick.dailyPrices) : {};
          } catch (e) {
            dailyPrices = {};
          }
          dailyPrices[dayKey] = {
            open: data.open,
            close: data.price
          };

          await prisma.pick.update({
            where: { id: pick.id },
            data: {
              dailyPrices: JSON.stringify(dailyPrices),
              currentPrice: data.price,
              weekReturn: data.price - pick.priceAtPick,
              weekReturnPct: ((data.price - pick.priceAtPick) / pick.priceAtPick) * 100
            }
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
      const history = await getDailyCandles(symbol, from, to);
      // Map by date for easy lookup
      const priceByDate = {};
      for (const day of history) {
        priceByDate[day.date] = day;
      }
      // Build dailyPrices for Mon-Fri
      const dailyPrices = {};
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
        data: { dailyPrices: JSON.stringify(dailyPrices) }
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

// Endpoint to force-create the next week
app.post('/api/weeks/next', async (req, res) => {
  try {
    const today = new Date();
    const nextMonday = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextSunday = endOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    let week = await prisma.week.findFirst({
      where: {
        startDate: nextMonday,
        endDate: nextSunday
      }
    });
    if (!week) {
      week = await prisma.week.create({
        data: {
          weekNum: Math.ceil((nextMonday.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate: nextMonday,
          endDate: nextSunday
        }
      });
    }
    res.json(week);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create next week' });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
}); 