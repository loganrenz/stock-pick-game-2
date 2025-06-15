import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./prisma/dev.db');

const addColumns = [
  { old: 'priceAtPick', new: 'entryPrice', type: 'REAL' },
  { old: 'currentPrice', new: 'currentValue', type: 'REAL' },
  { old: 'dailyPrices', new: 'dailyPriceData', type: 'TEXT' },
  { old: 'weekReturnPct', new: 'returnPercentage', type: 'REAL' }
];

function addColumnIfNotExists(oldName: string, newName: string, type: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(Pick);', (err, columns: any[]) => {
      if (err) return reject(err);
      const exists = columns.some(col => col.name === newName);
      if (!exists) {
        db.run(`ALTER TABLE Pick ADD COLUMN ${newName} ${type};`, err2 => {
          if (err2) return reject(err2);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function copyColumnData(oldName: string, newName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE Pick SET ${newName} = ${oldName} WHERE ${oldName} IS NOT NULL;`, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function migrate() {
  for (const col of addColumns) {
    await addColumnIfNotExists(col.old, col.new, col.type);
    await copyColumnData(col.old, col.new);
  }
  console.log('Migration complete.');
  db.close();
}

migrate().catch(e => { console.error(e); db.close(); }); 