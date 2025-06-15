import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./prisma/dev.db');

async function migrate() {
  // 1. Create a new table with only the new columns
  await new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS Pick_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      weekId INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      entryPrice REAL NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      dailyPriceData TEXT,
      currentValue REAL,
      weekReturn REAL,
      returnPercentage REAL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY (weekId) REFERENCES Week(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );`, err => err ? reject(err) : resolve(null));
  });

  // 2. Copy data from old table to new table
  await new Promise((resolve, reject) => {
    db.run(`INSERT INTO Pick_new (id, userId, weekId, symbol, entryPrice, createdAt, updatedAt, dailyPriceData, currentValue, weekReturn, returnPercentage)
      SELECT id, userId, weekId, symbol, entryPrice, createdAt, updatedAt, dailyPriceData, currentValue, weekReturn, returnPercentage FROM Pick;`,
      err => err ? reject(err) : resolve(null));
  });

  // 3. Drop old table
  await new Promise((resolve, reject) => {
    db.run('DROP TABLE Pick;', err => err ? reject(err) : resolve(null));
  });

  // 4. Rename new table
  await new Promise((resolve, reject) => {
    db.run('ALTER TABLE Pick_new RENAME TO Pick;', err => err ? reject(err) : resolve(null));
  });

  // 5. Recreate unique index
  await new Promise((resolve, reject) => {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS Pick_userId_weekId_key ON Pick(userId, weekId);', err => err ? reject(err) : resolve(null));
  });

  db.close();
  console.log('Old columns dropped, migration complete.');
}

migrate().catch(e => { console.error(e); db.close(); }); 