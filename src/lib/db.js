const Database = require('better-sqlite3')
const path = require('path')

let _db = null

function getDb() {
  if (_db) return _db
  let dbPath = path.join(process.cwd(), 'finn.db')
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initTables(_db)
  return _db
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      sector TEXT,
      city TEXT,
      relationship TEXT,
      last_contact TEXT,
      linkedin TEXT,
      prev_companies TEXT,
      expertise TEXT,
      strength INTEGER DEFAULT 3,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      ticker TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector TEXT,
      mcap TEXT,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      ticker TEXT,
      category TEXT,
      title TEXT NOT NULL,
      summary TEXT,
      detail TEXT,
      filing_url TEXT,
      importance INTEGER DEFAULT 1,
      published_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      period TEXT,
      revenue REAL,
      ebitda REAL,
      pbt REAL,
      pat REAL,
      revenue_prev_q REAL,
      ebitda_prev_q REAL,
      pbt_prev_q REAL,
      pat_prev_q REAL,
      revenue_prev_y REAL,
      ebitda_prev_y REAL,
      pbt_prev_y REAL,
      pat_prev_y REAL,
      debt REAL,
      equity REAL,
      ocf REAL,
      fcf REAL
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      query_type TEXT,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

module.exports = { getDb }
