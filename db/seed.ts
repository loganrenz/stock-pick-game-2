import { PrismaClient, Prisma } from '@prisma/client';
//import { prisma } from '../api/lib/db.ts';
//import prisma from '../prisma.config.ts'
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { endOfWeek, startOfWeek } from 'date-fns';
import { prisma } from '../api/lib/db.ts';

async function main() {
  // 1. Create users
  const users: Prisma.UserCreateInput[] = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
    },
    {
      username: 'patrick',
      password: await bcrypt.hash('patrickpw', 10),
    },
    {
      username: 'taylor',
      password: await bcrypt.hash('taylorpw', 10),
    },
    {
      username: 'logan',
      password: await bcrypt.hash('loganpw', 10),
    },
  ];

  console.log('Creating users...');
  const existingUsers = await prisma.user.findMany();
  
  const usersToCreate = users.filter(
    user => !existingUsers.some(existing => existing.username === user.username)
  );

  if (usersToCreate.length > 0) {
    await prisma.user.createMany({
      data: usersToCreate,
    });
    console.log(`Created ${usersToCreate.length} new users`);
  } else {
    console.log('No new users to create');
  }

  // Get all users (including newly created ones)
  const allUsers = await prisma.user.findMany();

  // 2. Parse CSV
  console.log('Parsing CSV...');
  const csvPath = path.resolve(import.meta.dirname, '../numbers-data/originaldata.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse(csvContent, { columns: false, skip_empty_lines: true });

  // 3. Organize weeks and picks
  console.log('Organizing weeks and picks...');
  type SimplePick = {
    userId: number;
    symbol: string;
    entryPrice: number;
    createdAt: Date;
    weekNum: number;
  };

  type SimpleWeek = {
    weekNum: number;
    startDate: Date;
    endDate: Date;
    winnerId?: number;
    picks: SimplePick[];
  };

  const weeks: SimpleWeek[] = [];
  let currentWeek: SimpleWeek | null = null;
  let currentWeekStartDate: Date | null = null;

  for (const row of records as string[][]) {
    if (/^\d+$/.test(row[0])) {
      // New week
      const weekNum = parseInt(row[0], 10);
      currentWeekStartDate = null;
      currentWeek = {
        weekNum,
        startDate: new Date(), // will be set from first pick
        endDate: new Date(),   // will be set later
        picks: [],
      };
      weeks.push(currentWeek);
    } else if (row[0] && row[0].toLowerCase() === 'winner') {
      // Winner row
      const winnerName = (row[1] || '').toLowerCase();
      if (currentWeek && winnerName) {
        const winner = allUsers.find(u => u.username.toLowerCase() === winnerName);
        if (winner) {
          currentWeek.winnerId = winner.id;
        }
      }
    } else if (row[2] && allUsers.find(u => u.username.toLowerCase() === row[2].toLowerCase())) {
      // Pick row
      const user = allUsers.find(u => u.username.toLowerCase() === row[2].toLowerCase())!;
      const symbol = row[3] || '';
      const entryPrice = parseFloat((row[5] || '').replace(/[^\d.\-]/g, ''));
      if (!symbol || isNaN(entryPrice)) continue;
      
      const createdAt = row[1] ? new Date(row[1]) : new Date();
      if (currentWeek) {
        // Set startDate from first pick
        if (!currentWeekStartDate) {
          currentWeekStartDate = startOfWeek(createdAt, { weekStartsOn: 1 });
          currentWeek.startDate = currentWeekStartDate;
          currentWeek.endDate = endOfWeek(createdAt, { weekStartsOn: 1 });
        }
        
        currentWeek.picks.push({
          userId: user.id,
          symbol,
          entryPrice,
          createdAt,
          weekNum: currentWeek.weekNum,
        });
      }
    }
  }

  // 4. Create weeks and picks in DB
  console.log('Creating weeks and picks...');
  
  // Check existing weeks
  const existingWeeks = await prisma.week.findMany({
    select: { weekNum: true }
  });

  const weeksToCreate = weeks.filter(
    week => !existingWeeks.some(existing => existing.weekNum === week.weekNum)
  );

  console.log('Weeks to create:', JSON.stringify(weeksToCreate, null, 2));

  // Create weeks one at a time to handle winner relationship
  for (const week of weeksToCreate) {
    await prisma.week.create({
      data: {
        weekNum: week.weekNum,
        startDate: week.startDate,
        endDate: week.endDate,
        winnerId: Number.isFinite(week.winnerId) ? week.winnerId : 0,
      }
    });
  }
  console.log(`Created ${weeksToCreate.length} new weeks`);

  // Get all weeks (including newly created ones) for pick creation
  const allWeeks = await prisma.week.findMany();
  
  // Prepare picks data
  const picksToCreate = weeks.flatMap(week => {
    const dbWeek = allWeeks.find(w => w.weekNum === week.weekNum);
    if (!dbWeek) return [];
    
    return week.picks.map(pick => ({
      userId: pick.userId,
      weekId: dbWeek.id,
      symbol: pick.symbol,
      entryPrice: pick.entryPrice,
      createdAt: pick.createdAt,
    }));
  });

  // Check for existing picks
  const existingPicks = await prisma.pick.findMany({
    where: {
      OR: picksToCreate.map(pick => ({
        AND: {
          userId: pick.userId,
          weekId: pick.weekId,
        },
      })),
    },
    select: {
      userId: true,
      weekId: true,
    },
  });

  const uniquePicksToCreate = picksToCreate.filter(
    pick => !existingPicks.some(
      existing => existing.userId === pick.userId && existing.weekId === pick.weekId
    )
  );

  if (uniquePicksToCreate.length > 0) {
    await prisma.pick.createMany({
      data: uniquePicksToCreate,
    });
    console.log(`Created ${uniquePicksToCreate.length} new picks`);
  } else {
    console.log('No new picks to create');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 