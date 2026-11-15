const path = require('path')
const fs = require('fs')
const { contacts, watchlist, sampleAnns, finData } = require('../data/seedData')

let _db = null

function getDb() {
  if (_db) return _db

  try {
    const Database = require('better-sqlite3')
    let dbPath = path.join(process.cwd(), 'finn.db')

    // On serverless environments (like Vercel / AWS Lambda), process.cwd() is read-only.
    // Use /tmp if local directory is not writable.
    try {
      fs.accessSync(process.cwd(), fs.constants.W_OK)
    } catch (e) {
      dbPath = path.join('/tmp', 'finn.db')
    }

    _db = new Database(dbPath)
    try {
      _db.pragma('journal_mode = WAL')
    } catch (e) {
      // WAL might fail on network filesystems or memory
    }
    _db.pragma('foreign_keys = ON')
    initTables(_db)
    seedIfEmpty(_db)
    return _db
  } catch (err) {
    console.warn('better-sqlite3 not available or failed to open; falling back to in-memory store:', err.message)
    _db = createMemoryStore()
    return _db
  }
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

function seedIfEmpty(db) {
  try {
    let countRow = db.prepare('SELECT count(*) as c FROM announcements').get()
    if (countRow && countRow.c > 0) return

    let insertContact = db.prepare(`
      INSERT OR REPLACE INTO contacts (id, name, company, role, sector, city, relationship, last_contact, linkedin, prev_companies, expertise, strength, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (let c of contacts) {
      insertContact.run(
        c.id, c.name, c.company, c.role, c.sector, c.city,
        c.relationship, c.lastContact, c.linkedin,
        JSON.stringify(c.prevCompanies), JSON.stringify(c.expertise),
        c.strength, c.notes
      )
    }

    let insertWl = db.prepare('INSERT OR REPLACE INTO watchlist (ticker, name, sector, mcap) VALUES (?, ?, ?, ?)')
    for (let w of watchlist) {
      insertWl.run(w.ticker, w.name, w.sector, w.mcap)
    }

    let insertAnn = db.prepare(`
      INSERT INTO announcements (company, ticker, category, title, summary, detail, importance, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (let a of sampleAnns) {
      insertAnn.run(a.company, a.ticker, a.category, a.title, a.summary, a.detail, a.importance, a.published_at)
    }

    let insertFin = db.prepare(`
      INSERT INTO financials (ticker, period, revenue, ebitda, pbt, pat, revenue_prev_q, ebitda_prev_q, pbt_prev_q, pat_prev_q, revenue_prev_y, ebitda_prev_y, pbt_prev_y, pat_prev_y, debt, equity, ocf, fcf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (let f of finData) {
      insertFin.run(f.ticker, f.period, f.revenue, f.ebitda, f.pbt, f.pat, f.rq, f.eq, f.pq, f.paq, f.ry, f.ey, f.py, f.pay, f.debt, f.equity, f.ocf, f.fcf)
    }
  } catch (err) {
    console.warn('auto-seed warning:', err.message)
  }
}

// In-memory fallback if better-sqlite3 native bindings fail on serverless
function createMemoryStore() {
  let contactsList = contacts.map(c => ({
    id: c.id,
    name: c.name,
    company: c.company,
    role: c.role,
    sector: c.sector,
    city: c.city,
    relationship: c.relationship,
    last_contact: c.lastContact,
    linkedin: c.linkedin,
    prev_companies: JSON.stringify(c.prevCompanies),
    expertise: JSON.stringify(c.expertise),
    strength: c.strength,
    notes: c.notes
  }))

  let watchlistList = watchlist.map(w => ({
    ticker: w.ticker,
    name: w.name,
    sector: w.sector,
    mcap: w.mcap,
    added_at: new Date().toISOString()
  }))

  let annList = sampleAnns.map((a, idx) => ({
    id: idx + 1,
    ...a,
    created_at: new Date().toISOString()
  }))

  let finList = finData.map((f, idx) => ({
    id: idx + 1,
    ticker: f.ticker,
    period: f.period,
    revenue: f.revenue,
    ebitda: f.ebitda,
    pbt: f.pbt,
    pat: f.pat,
    revenue_prev_q: f.rq,
    ebitda_prev_q: f.eq,
    pbt_prev_q: f.pq,
    pat_prev_q: f.paq,
    revenue_prev_y: f.ry,
    ebitda_prev_y: f.ey,
    pbt_prev_y: f.py,
    pat_prev_y: f.pay,
    debt: f.debt,
    equity: f.equity,
    ocf: f.ocf,
    fcf: f.fcf
  }))

  let cacheList = []

  return {
    exec: () => {},
    prepare: (sql) => {
      let s = sql.trim().toLowerCase()
      return {
        all: (...params) => {
          if (s.includes('from contacts')) {
            let res = [...contactsList]
            if (s.includes('order by strength desc')) res.sort((a, b) => b.strength - a.strength)
            return res
          }
          if (s.includes('from watchlist')) {
            if (s.includes('like')) {
              let term = (params[0] || '').replace(/%/g, '').toLowerCase()
              return watchlistList.filter(w => w.name.toLowerCase().includes(term) || w.ticker.toLowerCase().includes(term))
            }
            return [...watchlistList]
          }
          if (s.includes('from announcements')) {
            let res = [...annList]
            if (s.includes('where category = ?') && params[0]) {
              res = res.filter(a => a.category === params[0])
            }
            if (s.includes('where ticker = ?') && params[0]) {
              res = res.filter(a => a.ticker === params[0])
            }
            res.sort((a, b) => (b.importance || 0) - (a.importance || 0))
            let limit = params[params.length - 1]
            if (typeof limit === 'number') res = res.slice(0, limit)
            return res
          }
          return []
        },
        get: (...params) => {
          if (s.includes('count(*)')) return { c: annList.length }
          if (s.includes('from watchlist where ticker = ?')) {
            return watchlistList.find(w => w.ticker === params[0]) || null
          }
          if (s.includes('from financials where ticker = ?')) {
            return finList.find(f => f.ticker === params[0]) || null
          }
          if (s.includes('from analysis_cache')) {
            return cacheList.find(c => c.ticker === params[0] && c.query_type === params[1]) || null
          }
          return null
        },
        run: (...params) => {
          if (s.includes('into analysis_cache')) {
            cacheList.unshift({ ticker: params[0], query_type: params[1], result: params[2], created_at: new Date().toISOString() })
          }
          return { changes: 1 }
        }
      }
    }
  }
}

module.exports = { getDb }
