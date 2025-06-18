import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { weeks, picks } from '../../api-helpers/lib/schema.js';
import { eq, lte, gte, asc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';
import { fetchPriceData } from '../../api-helpers/stocks/price-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[WEEKS] Request received:', {
    method: req.method,
    url: req.url,
    path: req.url?.split('/').pop() || '',
    headers: req.headers
  });

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
    console.log('[WEEKS] Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  const path = req.url?.split('/').pop() || '';
  console.log('[WEEKS] Processing path:', path);

  switch (path) {
    case 'current':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for /current:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching current week');
        console.log('[WEEKS] DB URL:', process.env.TURSO_DB_URL);
        console.log('[WEEKS] DB Token:', process.env.TURSO_DB_TOKEN);
        const now = new Date();
        const currentWeek = await db.query.weeks.findFirst({
          where: and(
            lte(weeks.startDate, now.toISOString()),
            gte(weeks.endDate, now.toISOString())
          ),
          with: {
            picks: true,
            winner: true
          }
        });

        if (!currentWeek) {
          console.log('[WEEKS] No current week found, creating new week');
          // Find the most recent Monday
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
          const daysSinceMonday = (dayOfWeek + 6) % 7; // 0 if Mon, 1 if Tue, ... 6 if Sun
          const monday = new Date(today);
          monday.setDate(today.getDate() - daysSinceMonday);
          monday.setHours(0, 0, 0, 0);
          const friday = new Date(monday);
          friday.setDate(monday.getDate() + 4);
          friday.setHours(23, 59, 59, 999);
          console.log(`[WEEKS][DEBUG] Today: ${today.toISOString()} | dayOfWeek: ${dayOfWeek} | daysSinceMonday: ${daysSinceMonday}`);
          console.log(`[WEEKS][DEBUG] Calculated Monday: ${monday.toISOString()} | Calculated Friday: ${friday.toISOString()}`);
          const [newWeek] = await db.insert(weeks).values({
            weekNum: 1,
            startDate: monday.toISOString(),
            endDate: friday.toISOString()
          }).returning();
          console.log('[WEEKS][DEBUG] Inserted new week:', newWeek);
          return res.status(200).json(newWeek);
        }

        // Update picks if needed (entryPrice or returnPercentage missing, or updatedAt > 20 min ago)
        console.log('[WEEKS] Updating picks prices');
        for (const pick of currentWeek.picks) {
          const lastUpdate = pick.updatedAt ? new Date(pick.updatedAt) : null;
          const nowTime = Date.now();
          const needsUpdate =
            !pick.entryPrice || pick.entryPrice === 0 ||
            pick.returnPercentage == null ||
            pick.dailyPriceData == null ||
            !lastUpdate || (
              (pick.dailyPriceData != null && pick.returnPercentage != null) &&
              (nowTime - lastUpdate.getTime() > 20 * 60 * 1000)
            );
          if (needsUpdate) {
            let dailyPriceData = null;
            let currentPrice = null;
            try {
              const result = await fetchPriceData(pick.symbol);
              dailyPriceData = result.dailyPriceData;
              currentPrice = result.currentPrice;
              console.log('[WEEKS] Daily price data:', dailyPriceData);
              console.log('[WEEKS] Current price:', currentPrice);
            } catch (error) {
              console.error('[WEEKS] Error fetching price data:', error);
              continue;
            }

            // Calculate entry price and current value
            let entryPrice = pick.entryPrice;
            let currentValue = currentPrice;
            let returnPercentage = null;

            if (dailyPriceData) {
              // Find Monday open (first available day) for entry price
              const dpd = dailyPriceData as Record<string, { open: number, close: number }>;
              const days = Object.keys(dpd);
              if (days.length > 0) {
                entryPrice = dpd[days[0]].open;
                // Use the latest available close price for current value
                currentValue = dpd[days[days.length - 1]].close;
              }
            }

            // Calculate return percentage if we have both prices
            if (entryPrice && currentValue) {
              returnPercentage = ((currentValue - entryPrice) / entryPrice) * 100;
              console.log(`[WEEKS] Calculated return for ${pick.symbol}: ${returnPercentage.toFixed(2)}% (entry: ${entryPrice}, current: ${currentValue})`);
            }

            // Update pick with new data
            if (entryPrice && currentValue && returnPercentage !== null) {
              await db.update(picks)
                .set({
                  entryPrice,
                  currentValue,
                  returnPercentage,
                  dailyPriceData: JSON.stringify(dailyPriceData),
                  updatedAt: new Date().toISOString()
                })
                .where(eq(picks.id, pick.id));
              console.log(`[WEEKS] Updated pick ${pick.id} (${pick.symbol}): entryPrice=${entryPrice}, currentValue=${currentValue}, returnPercentage=${returnPercentage.toFixed(2)}%`);
            } else {
              console.log(`[WEEKS] Skipping update for pick ${pick.id} (${pick.symbol}) - missing required data`);
            }
          }
        }

        // Fetch all users for mapping
        const allUsers = await db.query.users.findMany();
        // Attach user object to each pick
        const weekWithUserPicks = {
          ...currentWeek,
          picks: currentWeek.picks.map(pick => ({
            ...pick,
            user: allUsers.find(u => u.id === pick.userId) || { id: pick.userId, username: 'Unknown' }
          }))
        };
        console.log('[WEEKS] Found current week:', weekWithUserPicks);
        return res.status(200).json(weekWithUserPicks);
      } catch (error) {
        console.error('[WEEKS] Current week error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'list':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for /list:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching all weeks');
        const allWeeks = await db.query.weeks.findMany({
          orderBy: asc(weeks.weekNum)
        });
        //console.log('[WEEKS] Found weeks:', allWeeks);
        return res.status(200).json({ weeks: allWeeks });
      } catch (error) {
        console.error('[WEEKS] List weeks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case '':
    case 'weeks':
      if (req.method !== 'GET') {
        console.log('[WEEKS] Invalid method for root path:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        console.log('[WEEKS] Fetching all weeks from root path');
        console.log('[WEEKS] TURSO_DB_URL:', process.env.TURSO_DB_URL);
        console.log('[WEEKS] TURSO_DB_TOKEN:', process.env.TURSO_DB_TOKEN);
        // Fetch all weeks with picks and winner info
        const allWeeks = await db.query.weeks.findMany({
          orderBy: asc(weeks.weekNum),
          with: {
            picks: true,
            winner: true
          }
        });
        // Fetch all users for mapping
        const allUsers = await db.query.users.findMany();
        // Attach user object to each pick
        const weeksWithUserPicks = allWeeks.map(week => ({
          ...week,
          picks: week.picks.map(pick => ({
            ...pick,
            user: allUsers.find(u => u.id === pick.userId) || { id: pick.userId, username: 'Unknown' }
          }))
        }));
        //console.log('[WEEKS] Found weeks:', weeksWithUserPicks);
        return res.status(200).json({ weeks: weeksWithUserPicks });
      } catch (error) {
        console.error('[WEEKS] List weeks error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      console.log('[WEEKS] Path not found:', path);
      return res.status(404).json({ error: 'Not found' });
  }
} 