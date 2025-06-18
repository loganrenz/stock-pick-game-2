import { db } from '../api-helpers/lib/db.js';
import { picks, users, weeks } from '../api-helpers/lib/schema.js';
import { eq, and, lte, gte } from 'drizzle-orm';

async function main() {
  // Find Patrick
  const patrick = await db.query.users.findFirst({ where: eq(users.username, 'patrick') });
  if (!patrick) throw new Error('Patrick not found');

  // Find current week
  const now = new Date();
  const currentWeek = await db.query.weeks.findFirst({
    where: and(
      lte(weeks.startDate, now.toISOString()),
      gte(weeks.endDate, now.toISOString())
    )
  });
  if (!currentWeek) throw new Error('Current week not found');

  // Check if Patrick already has a pick for this week
  const existing = await db.query.picks.findFirst({
    where: and(
      eq(picks.userId, patrick.id),
      eq(picks.weekId, currentWeek.id)
    )
  });
  if (existing) {
    console.log('Patrick already has a pick for the current week.');
    return;
  }

  // Add Patrick's pick (RIOT)
  await db.insert(picks).values({
    userId: patrick.id,
    weekId: currentWeek.id,
    symbol: 'RIOT',
    entryPrice: 0, // Set the correct price if you have it
    createdAt: new Date().toISOString()
  });
  console.log('Added Patrick\'s pick (RIOT) for the current week.');
}

main().catch(console.error); 