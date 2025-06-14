import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  // Create users with passwords
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
    },
  });
  const patrick = await prisma.user.upsert({
    where: { username: 'patrick' },
    update: {},
    create: {
      username: 'patrick',
      password: await bcrypt.hash('patrickpw', 10),
    },
  });
  const taylor = await prisma.user.upsert({
    where: { username: 'taylor' },
    update: {},
    create: {
      username: 'taylor',
      password: await bcrypt.hash('taylorpw', 10),
    },
  });
  const logan = await prisma.user.upsert({
    where: { username: 'logan' },
    update: {},
    create: {
      username: 'logan',
      password: await bcrypt.hash('loganpw', 10),
    },
  });

  // Import weeks and picks from CSV
  const csvPath = path.resolve(__dirname, '../../numbers-data/originaldata.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse(csvContent, { columns: false, skip_empty_lines: true });

  let currentWeekNum = 0;
  let currentWeek: any = null;
  let winnerUsername = '';
  const userMap: { [key: string]: typeof patrick } = { patrick, taylor, logan, admin };
  const weeksData: any[] = [];

  for (const row of records as string[][]) {
    if (/^\d+$/.test(row[0])) {
      // New week
      currentWeekNum = parseInt(row[0], 10);
      currentWeek = { weekNum: currentWeekNum, picks: [], weekStartDate: '' };
      weeksData.push(currentWeek);
    } else if (row[0] && row[0].toLowerCase() === 'winner') {
      winnerUsername = (row[1] || '').toLowerCase();
      if (currentWeek && userMap[winnerUsername]) {
        currentWeek.winnerId = userMap[winnerUsername].id;
      }
    } else if (row[2] && userMap[row[2].toLowerCase()]) {
      // Pick row
      const user = userMap[row[2].toLowerCase()];
      const symbol = row[3] || '';
      const priceAtPick = parseFloat((row[5] || '').replace(/[^\d.\-]/g, ''));
      if (!symbol || isNaN(priceAtPick)) continue; // skip invalid pick rows
      const createdAt = row[1] ? new Date(row[1]) : new Date();
      if (!currentWeek.weekStartDate && row[1]) currentWeek.weekStartDate = row[1];
      const currentPrice = parseFloat((row[10] || '').replace(/[^\d.\-]/g, ''));
      const weekReturn = parseFloat((row[12] || '').replace(/[^\d.\-]/g, ''));
      const weekReturnPct = parseFloat((row[13] || '').replace(/[^\d.\-]/g, ''));
      const totalReturn = parseFloat((row[15] || '').replace(/[^\d.\-]/g, ''));
      currentWeek.picks.push({
        userId: user.id,
        symbol,
        priceAtPick,
        createdAt,
        currentPrice: isNaN(currentPrice) ? undefined : currentPrice,
        weekReturn: isNaN(weekReturn) ? undefined : weekReturn,
        weekReturnPct: isNaN(weekReturnPct) ? undefined : weekReturnPct,
        totalReturn: isNaN(totalReturn) ? undefined : totalReturn,
      });
    }
  }

  for (const weekData of weeksData) {
    const { picks, weekStartDate, ...weekInfo } = weekData;
    // Set startDate from the first pick row for the week
    weekInfo.startDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const week = await prisma.week.create({ data: weekInfo });
    for (const pickData of picks) {
      await prisma.pick.create({ data: { ...pickData, weekId: week.id } });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 