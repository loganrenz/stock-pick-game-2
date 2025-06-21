import { db } from '../lib/db.js';
import { picks } from '../lib/schema.js';

async function checkPickDates() {
  console.log('🔍 Checking pick creation dates...\n');

  const allPicks = await db
    .select({
      symbol: picks.symbol,
      createdAt: picks.createdAt,
      weekId: picks.weekId,
    })
    .from(picks)
    .orderBy(picks.createdAt);

  console.log(`📊 Total picks: ${allPicks.length}\n`);

  // Group by symbol and find earliest date
  const symbolDates = new Map<string, Date>();
  for (const pick of allPicks) {
    const existing = symbolDates.get(pick.symbol);
    if (!existing || new Date(pick.createdAt) < existing) {
      symbolDates.set(pick.symbol, new Date(pick.createdAt));
    }
  }

  // Show date ranges
  const dates = Array.from(symbolDates.values()).sort();
  console.log('📅 Date ranges:');
  console.log(`   Earliest pick: ${dates[0]?.toISOString()}`);
  console.log(`   Latest pick: ${dates[dates.length - 1]?.toISOString()}`);
  console.log(
    `   Date range: ${Math.ceil((dates[dates.length - 1]?.getTime() - dates[0]?.getTime()) / (1000 * 60 * 60 * 24))} days`,
  );
  console.log('');

  // Show first 10 picks
  console.log('📋 First 10 picks:');
  for (let i = 0; i < Math.min(10, allPicks.length); i++) {
    const pick = allPicks[i];
    console.log(`   ${pick.symbol} - Week ${pick.weekId} - ${pick.createdAt}`);
  }

  console.log('\n📋 Last 10 picks:');
  for (let i = Math.max(0, allPicks.length - 10); i < allPicks.length; i++) {
    const pick = allPicks[i];
    console.log(`   ${pick.symbol} - Week ${pick.weekId} - ${pick.createdAt}`);
  }
}

checkPickDates().catch(console.error);
