import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { db } from '../api/lib/db';
import { users, weeks, picks } from '../api/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

// Helper to parse US date format
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split('/').map(Number);
  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
}

async function main() {
  const csvPath = path.resolve(import.meta.dirname, '../numbers-data/originaldata.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse(csvContent, { columns: false, skip_empty_lines: false });

  let weekNum = 0;
  let prevWeekData: any = null;
  let i = 0;
  while (i < records.length) {
    const row = records[i];
    // Detect start of a week block
    if (/^\d+$/.test((row[0] || '').trim())) {
      weekNum = parseInt(row[0], 10);
      // Find the next non-empty date row
      let dateRow = records[i + 1];
      let weekDate = dateRow && dateRow[1] ? dateRow[1].trim() : '';
      let weekStart = parseDate(weekDate);
      if (!weekStart && prevWeekData) {
        weekStart = prevWeekData.weekStart;
      }
      let weekEnd = new Date(weekStart!);
      weekEnd.setDate(weekStart!.getDate() + 6);

      // Collect picks for this week
      let picksArr: any[] = [];
      let winner = null;
      for (let j = i + 2; j < records.length; j++) {
        const pickRow = records[j];
        if (pickRow[0] && pickRow[0].toLowerCase().includes('winner')) {
          winner = pickRow[1] ? pickRow[1].trim() : null;
          break;
        }
        if (pickRow[2]) {
          picksArr.push({
            username: pickRow[2].trim(),
            symbol: pickRow[3]?.trim() || null,
            entryPrice: pickRow[4]?.replace('$', '').trim() || null,
          });
        }
      }
      // Use previous week data if missing
      if (!weekStart && prevWeekData) {
        weekStart = prevWeekData.weekStart;
        weekEnd = prevWeekData.weekEnd;
        picksArr = prevWeekData.picksArr;
        winner = prevWeekData.winner;
      }
      // Check if week already exists
      const existingWeek = await db.query.weeks.findFirst({ where: eq(weeks.startDate, weekStart!.toISOString()) });
      let weekRow;
      if (existingWeek) {
        console.log(`Week ${weekNum} (${weekStart!.toISOString()}) already exists, skipping week insert.`);
        weekRow = existingWeek;
      } else {
        [weekRow] = await db.insert(weeks)
          .values({
            weekNum,
            startDate: weekStart!.toISOString(),
            endDate: weekEnd!.toISOString(),
          })
          .returning();
        console.log(`Inserted week ${weekNum} (${weekStart!.toISOString()})`);
      }
      // Insert picks
      for (const pick of picksArr) {
        const usernameLower = pick.username.toLowerCase();
        const user = await db.query.users.findFirst({ where: sql`lower(${users.username}) = ${usernameLower}` });
        if (!user) {
          console.warn(`User not found: ${pick.username}`);
          continue;
        }
        // Check if pick already exists for this user/week/symbol
        const existingPick = await db.query.picks.findFirst({
          where: and(
            eq(picks.userId, user.id),
            eq(picks.weekId, weekRow.id),
            eq(picks.symbol, pick.symbol || '')
          )
        });
        if (existingPick) {
          console.log(`Pick for user ${pick.username}, week ${weekNum}, symbol ${pick.symbol} already exists, skipping.`);
          continue;
        }
        if (!pick.symbol || !pick.entryPrice) {
          console.warn(`Incomplete pick for user ${pick.username}, week ${weekNum}: symbol=${pick.symbol}, entryPrice=${pick.entryPrice}`);
        }
        await db.insert(picks)
          .values({
            userId: user.id,
            weekId: weekRow.id,
            symbol: pick.symbol || '',
            entryPrice: pick.entryPrice ? parseFloat(pick.entryPrice) : 0,
          });
        console.log(`Inserted pick for user ${pick.username}, week ${weekNum}, symbol ${pick.symbol}`);
      }
      // Update winner
      if (winner) {
        const winnerLower = winner.toLowerCase();
        const winnerUser = await db.query.users.findFirst({ where: sql`lower(${users.username}) = ${winnerLower}` });
        if (winnerUser) {
          await db.update(weeks)
            .set({ winnerId: winnerUser.id })
            .where(eq(weeks.id, weekRow.id));
          console.log(`Set winner for week ${weekNum}: ${winner}`);
        } else {
          console.warn(`Winner user not found: ${winner}`);
        }
      }
      // Save for next iteration
      prevWeekData = { weekStart, weekEnd, picksArr, winner };
    }
    i++;
  }
  console.log('Backfill complete!');
}

main().catch(console.error); 