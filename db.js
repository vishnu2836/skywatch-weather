const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = path.join(__dirname, 'weather.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ Error opening database:', err.message);
  else     console.log('✅ Connected to SQLite database');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS searches (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      city        TEXT    NOT NULL,
      temperature REAL,
      description TEXT,
      searched_at TEXT    DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error('❌ Error creating table:', err.message);
    else     console.log('✅ Table "searches" ready');
  });
});

module.exports = db;