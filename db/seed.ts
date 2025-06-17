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

  const weeksToCreate: SimpleWeek[] = [];

  for (const pick of weeks.flatMap(week => week.picks)) {
    const pickDate = new Date(pick.createdAt);
    const weekStartDate = startOfWeek(pickDate, { weekStartsOn: 1 }); // Monday
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    if (!currentWeekStartDate || weekStartDate.getTime() !== currentWeekStartDate.getTime()) {
      currentWeekStartDate = weekStartDate;
      weeksToCreate.push({
        weekNum: weeksToCreate.length + 1,
        startDate: weekStartDate,
        endDate: weekEndDate,
        picks: [],
      });
    }

    const currentWeek = weeksToCreate[weeksToCreate.length - 1];
    currentWeek.picks.push({
      userId: pick.userId,
      symbol: pick.symbol,
      entryPrice: pick.entryPrice,
      createdAt: pickDate,
      weekNum: currentWeek.weekNum,
    });
  }

  // Copy picks from the previous week if a week has no picks
  for (let i = 1; i < weeksToCreate.length; i++) {
    if (weeksToCreate[i].picks.length === 0 && weeksToCreate[i - 1].picks.length > 0) {
      weeksToCreate[i].picks = weeksToCreate[i - 1].picks.map(pick => ({
        ...pick,
        weekNum: weeksToCreate[i].weekNum,
      }));
    }
  }

  console.log('Weeks to create:', JSON.stringify(weeksToCreate, null, 2));

  // Get all weeks (including newly created ones) for pick creation
  const allExistingWeeks = await prisma.week.findMany({ select: { weekNum: true, startDate: true } });

  // Create weeks one at a time to handle winner relationship
  for (const week of weeksToCreate) {
    // Check if week already exists
    const exists = allExistingWeeks.some(
      w => w.weekNum === week.weekNum || new Date(w.startDate).getTime() === new Date(week.startDate).getTime()
    );
    if (exists) {
      console.log(`Skipping weekNum ${week.weekNum} (already exists)`);
      continue;
    }
    const weekData: any = {
      weekNum: week.weekNum,
      startDate: week.startDate,
      endDate: week.endDate,
    };
    if (typeof week.winnerId === 'number' && Number.isInteger(week.winnerId) && week.winnerId > 0) {
      weekData.winnerId = week.winnerId;
    }
    console.log('Creating week with data:', JSON.stringify(weekData));
    await prisma.week.create({ data: weekData });
  }
  console.log(`Created ${weeksToCreate.length} new weeks`);

  // Get all weeks (including newly created ones) for pick creation
  const allWeeks = await prisma.week.findMany();
  
  // Prepare picks data
  const picksToCreate = weeksToCreate.flatMap(week => {
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