const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./prisma/dev.db');

// 1. Add new columns if they don't exist
const addColumns = [
  { old: 'priceAtPick', new: 'entryPrice', type: 'REAL' },
  { old: 'currentPrice', new: 'currentValue', type: 'REAL' },
  { old: 'dailyPrices', new: 'dailyPriceData', type: 'TEXT' },
  { old: 'weekReturnPct', new: 'returnPercentage', type: 'REAL' }
];

function addColumnIfNotExists(oldName, newName, type) {
  return new Promise((resolve, reject) => {
    db.get(`PRAGMA table_info(Pick);`, (err, info) => {
      if (err) return reject(err);
      db.all(`PRAGMA table_info(Pick);`, (err, columns) => {
        if (err) return reject(err);
        const exists = columns.some(col => col.name === newName);
        if (!exists) {
          db.run(`ALTER TABLE Pick ADD COLUMN ${newName} ${type};`, err => {
            if (err) return reject(err);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  });
}

function copyColumnData(oldName, newName) {
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