import { db } from './db.js';
import { picks, weeks } from './schema.js';
import { eq, and, lte, gte, lt } from 'drizzle-orm';

async function fixWeeksData() {
  console.log('Fixing weeks data...');

  // Get user IDs
  const users = await db.query.users.findMany();
  const userMap = new Map(users.map((u) => [u.username.toLowerCase(), u.id]));

  // Get all weeks except the current week
  const now = new Date();
  const allWeeks = await db.query.weeks.findMany({
    where: lt(weeks.weekNum, 31), // Week 31 is current
    orderBy: weeks.weekNum,
  });

  // Update historical weeks to have past dates
  for (const week of allWeeks) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (31 - week.weekNum) * 7); // Each week is 7 days before the next
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Monday to Friday
    endDate.setHours(23, 59, 59, 999);

    await db
      .update(weeks)
      .set({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      .where(eq(weeks.id, week.id));

    console.log(`Updated Week ${week.weekNum} dates to:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  // Fix Week 13 - Add Patrick's pick
  const week13 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 13),
    with: {
      picks: true,
    },
  });

  if (week13) {
    const patrickId = userMap.get('patrick');
    if (patrickId) {
      const existingPick = week13.picks.find((p) => p.userId === patrickId);
      if (!existingPick) {
        console.log("Adding Patrick's Week 13 pick (LMT)...");
        await db.insert(picks).values({
          userId: patrickId,
          weekId: week13.id,
          symbol: 'LMT',
          entryPrice: 458.71, // You'll need to verify this value
          currentValue: 458.71, // You'll need to verify this value
          returnPercentage: 0, // You'll need to verify this value
          weekReturn: 0, // You'll need to verify this value
        });
      }
    }
  }

  // Fix Week 14 data
  const week14Picks = [
    {
      username: 'Patrick',
      symbol: 'WING',
      entryPrice: 350.32,
      currentValue: 234.02,
      returnPercentage: -33.2,
    },
    {
      username: 'Taylor',
      symbol: 'UAL',
      entryPrice: 74.3,
      currentValue: 95.89,
      returnPercentage: 29.06,
    },
    {
      username: 'Logan',
      symbol: 'WMT',
      entryPrice: 95.09,
      currentValue: 94.78,
      returnPercentage: -0.33,
    },
  ];

  let week14 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 14),
    with: {
      picks: true,
    },
  });

  if (week14) {
    // Delete existing picks for week 14
    if (week14.picks.length > 0) {
      await db.delete(picks).where(eq(picks.weekId, week14.id));
    }
  } else {
    // Create week 14 if it doesn't exist
    const [newWeek] = await db
      .insert(weeks)
      .values({
        weekNum: 14,
        startDate: '2025-02-17T00:00:00.000Z',
        endDate: '2025-02-21T23:59:59.999Z',
      })
      .returning();
    week14 = newWeek;
  }

  // Add Week 14 picks
  for (const pickData of week14Picks) {
    const userId = userMap.get(pickData.username.toLowerCase());
    if (!userId) {
      console.log(`User ${pickData.username} not found`);
      continue;
    }

    await db.insert(picks).values({
      userId,
      weekId: week14.id,
      symbol: pickData.symbol,
      entryPrice: pickData.entryPrice,
      currentValue: pickData.currentValue,
      returnPercentage: pickData.returnPercentage,
      weekReturn: pickData.currentValue - pickData.entryPrice,
    });
  }

  // Fix Week 28 data
  const week28Picks = [
    {
      username: 'Patrick',
      symbol: 'NVDA',
      entryPrice: 145.48,
      currentValue: 135.13,
      returnPercentage: -7.11,
    },
    {
      username: 'Taylor',
      symbol: 'Baba',
      entryPrice: 113.49,
      currentValue: 113.84,
      returnPercentage: 0.31,
    },
    {
      username: 'Logan',
      symbol: 'Ba',
      entryPrice: 197.68,
      currentValue: 207.32,
      returnPercentage: 4.88,
    },
  ];

  let week28 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 28),
    with: {
      picks: true,
    },
  });

  if (week28) {
    // Delete existing picks for week 28
    if (week28.picks.length > 0) {
      await db.delete(picks).where(eq(picks.weekId, week28.id));
    }
  } else {
    // Create week 28 if it doesn't exist
    const [newWeek] = await db
      .insert(weeks)
      .values({
        weekNum: 28,
        startDate: '2025-05-26T00:00:00.000Z',
        endDate: '2025-05-30T23:59:59.999Z',
      })
      .returning();
    week28 = newWeek;
  }

  // Add Week 28 picks
  for (const pickData of week28Picks) {
    const userId = userMap.get(pickData.username.toLowerCase());
    if (!userId) {
      console.log(`User ${pickData.username} not found`);
      continue;
    }

    await db.insert(picks).values({
      userId,
      weekId: week28.id,
      symbol: pickData.symbol,
      entryPrice: pickData.entryPrice,
      currentValue: pickData.currentValue,
      returnPercentage: pickData.returnPercentage,
      weekReturn: pickData.currentValue - pickData.entryPrice,
    });
  }

  // Fix current week calculation
  const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  // Find current week
  const currentWeek = await db.query.weeks.findFirst({
    where: and(lte(weeks.startDate, now.toISOString()), gte(weeks.endDate, now.toISOString())),
  });

  if (currentWeek) {
    // Update current week dates
    await db
      .update(weeks)
      .set({
        startDate: monday.toISOString(),
        endDate: friday.toISOString(),
      })
      .where(eq(weeks.id, currentWeek.id));
  }

  console.log('Fixed weeks data');
}

fixWeeksData().catch(console.error);
