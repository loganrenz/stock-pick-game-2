import { db } from './db.js';
import { picks, weeks } from './schema.js';
import { eq } from 'drizzle-orm';

async function fixMissingWeeks() {
  console.log('Fixing missing data for weeks 14 and 28...');

  // Week 14 data from screenshot
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

  // Week 28 data from screenshot
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

  // Get user IDs
  const users = await db.query.users.findMany();
  const userMap = new Map(users.map((u) => [u.username.toLowerCase(), u.id]));

  // Fix Week 14
  let week14 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 14),
  });

  if (!week14) {
    console.log('Creating Week 14...');
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

    const existingPick = await db.query.picks.findFirst({
      where: eq(picks.weekId, week14.id),
    });

    if (!existingPick) {
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
  }

  // Fix Week 28
  let week28 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 28),
  });

  if (!week28) {
    console.log('Creating Week 28...');
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

    const existingPick = await db.query.picks.findFirst({
      where: eq(picks.weekId, week28.id),
    });

    if (!existingPick) {
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
  }

  console.log('Fixed missing data for weeks 14 and 28');
}

fixMissingWeeks().catch(console.error);
