import { db } from './db.js';
import { users, weeks, picks } from './schema.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function main() {
  console.log('Starting database seeding...');

  // Clean up tables before seeding
  console.log('Clearing Picks, Weeks, and Users tables...');
  await db.delete(picks);
  await db.delete(weeks);
  await db.delete(users, {
    where: (u) => !['patrick', 'taylor', 'logan'].includes(u.username)
  });

  // Create test users
  const testUsers = [
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
    }
  ];

  console.log('Creating test users...');
  const createdUsers = [];
  
  for (const user of testUsers) {
    console.log('Seeding user:', user.username);
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, user.username)
    });

    if (!existingUser) {
      const [newUser] = await db.insert(users)
        .values(user)
        .returning();
      console.log('Created user:', newUser.username);
      createdUsers.push(newUser);
    } else {
      console.log('User already exists:', existingUser.username);
      createdUsers.push(existingUser);
    }
  }

  // Read and parse CSV data
  console.log('Reading CSV data...');
  const csvPath = path.resolve(process.cwd(), 'numbers-data', 'originaldata.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Process CSV data
  console.log('Processing CSV data...');
  let currentWeek = null;
  let currentWeekData = [];
  const weeksData = [];

  for (const record of records) {
    // Check if this is a week header
    if (record.Week && record.Week !== '') {
      if (currentWeek && currentWeekData.length > 0) {
        weeksData.push({
          weekNum: parseInt(currentWeek),
          data: currentWeekData
        });
      }
      currentWeek = record.Week;
      currentWeekData = [];
    }
    // Check if this is a pick record
    else if (record.Date && record.Picker && record.Symbol && record.Symbol !== '-') {
      currentWeekData.push(record);
    }
    // Check if this is a winner record
    else if (record.Winner === 'Winner' && record.Picker) {
      if (currentWeekData.length > 0) {
        currentWeekData[0].Winner = record.Picker;
      }
    }
  }
  // Add the last week
  if (currentWeek && currentWeekData.length > 0) {
    weeksData.push({
      weekNum: parseInt(currentWeek),
      data: currentWeekData
    });
  }

  // Find the week that should be 'current' (covering today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentWeekIdx = weeksData.findIndex(wd => {
    const start = new Date(wd.data[0].Date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return start <= today && today <= end;
  });

  // If no week covers today, pick the most recent week and make it current
  if (currentWeekIdx === -1 && weeksData.length > 0) {
    currentWeekIdx = weeksData.length - 1;
    // Adjust its start/end dates to cover today
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(start.getDate() + 6);
    weeksData[currentWeekIdx].data.forEach(row => { row.Date = start.toISOString().slice(0, 10); });
  }

  // Now create weeks and picks, ensuring the current week covers today
  for (let i = 0; i < weeksData.length; i++) {
    const weekData = weeksData[i];
    if (weekData.data.length === 0) continue;

    let startDate = new Date(weekData.data[0].Date);
    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    if (i === currentWeekIdx) {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(startDate.getDate() + 6);
    }

    const winner = weekData.data[0].Winner;
    const winnerUser = winner ? createdUsers.find(u => u.username.toLowerCase() === winner.toLowerCase()) : null;

    const [week] = await db.insert(weeks)
      .values({
        weekNum: weekData.weekNum,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        winnerId: winnerUser?.id || null
      })
      .returning();
    console.log(`Created week ${week.weekNum}`);

    // Create picks for this week
    for (const pickData of weekData.data) {
      if (!pickData.Picker || !pickData.Symbol || pickData.Symbol === '-') continue;

      const user = createdUsers.find(u => u.username.toLowerCase() === pickData.Picker.toLowerCase());
      if (!user) {
        console.log(`Warning: User ${pickData.Picker} not found`);
        continue;
      }

      // Parse numeric values safely
      const entryPrice = parseFloat((pickData['Price at Pick'] || '').replace('$', ''));
      const currentValue = parseFloat((pickData.Price || '').replace('$', ''));
      const weekReturn = parseFloat((pickData['Return 1 Week'] || '').replace('$', ''));
      const returnPercentage = parseFloat((pickData['Return 1 Week %'] || '').replace('%', ''));

      // If entryPrice is not a finite number, skip this pick
      if (!Number.isFinite(entryPrice)) {
        console.log(`Skipping pick for ${user.username} in week ${week.weekNum}: ${pickData.Symbol} (invalid entryPrice)`);
        continue;
      }

      const dailyPriceData = {
        Monday: { open: pickData.Mon || pickData['Price at Pick'], close: pickData.Mon || pickData['Price at Pick'] },
        Tuesday: { open: pickData.Tue || pickData['Price at Pick'], close: pickData.Tue || pickData['Price at Pick'] },
        Wednesday: { open: pickData.Wed || pickData['Price at Pick'], close: pickData.Wed || pickData['Price at Pick'] },
        Thursday: { open: pickData.Thur || pickData['Price at Pick'], close: pickData.Thur || pickData['Price at Pick'] },
        Friday: { open: pickData.Fri || pickData['Price at Pick'], close: pickData.Fri || pickData['Price at Pick'] }
      };

      const [pick] = await db.insert(picks)
        .values({
          userId: user.id,
          weekId: week.id,
          symbol: pickData.Symbol,
          entryPrice,
          dailyPriceData: JSON.stringify(dailyPriceData),
          currentValue: Number.isFinite(currentValue) ? currentValue : null,
          weekReturn: Number.isFinite(weekReturn) ? weekReturn : null,
          returnPercentage: Number.isFinite(returnPercentage) ? returnPercentage : null
        })
        .returning();
      console.log(`Created pick for ${user.username} in week ${week.weekNum}: ${pickData.Symbol}`);
    }
  }

  console.log('Database seeding completed successfully!');
}

// Only run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main().catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });
} 