import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db.js';
import { users, weeks, picks } from './schema.js';
import { sql } from 'drizzle-orm';

export async function main() {
  try {
    // Test connection
    await db.run(sql`SELECT 1;`);
    console.log('DB connection successful');
  } catch (err) {
    console.error('DB connection failed:', err);
    throw err;
  }

  try {
    // Drop tables if they exist (order matters due to foreign keys)
    await db.run(sql`DROP TABLE IF EXISTS Pick;`);
    await db.run(sql`DROP TABLE IF EXISTS Week;`);
    await db.run(sql`DROP TABLE IF EXISTS User;`);
    console.log('Creating tables...');
  
    // Create users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT,
        jwtToken TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT
      );
    `);

    // Create weeks table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS Week (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekNum INTEGER NOT NULL,
        startDate TEXT NOT NULL UNIQUE,
        endDate TEXT,
        winnerId INTEGER REFERENCES User(id),
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT
      );
    `);

    // Create picks table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS Pick (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL REFERENCES User(id),
        weekId INTEGER NOT NULL REFERENCES Week(id),
        symbol TEXT NOT NULL,
        entryPrice REAL NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        dailyPriceData TEXT,
        currentValue REAL,
        weekReturn REAL,
        returnPercentage REAL,
        UNIQUE(userId, weekId)
      );
    `);

    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

// Only run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} 