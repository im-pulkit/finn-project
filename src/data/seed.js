const { getDb } = require('../lib/db')
const { contacts, watchlist, sampleAnns, finData } = require('./seedData')

function seed() {
  let db = getDb()

  try {
    db.exec('DELETE FROM contacts')
    db.exec('DELETE FROM watchlist')
    db.exec('DELETE FROM announcements')
    db.exec('DELETE FROM financials')
  } catch (e) {}

  let insertContact = db.prepare(`
    INSERT INTO contacts (id, name, company, role, sector, city, relationship, last_contact, linkedin, prev_companies, expertise, strength, notes)
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

  let insertWl = db.prepare('INSERT INTO watchlist (ticker, name, sector, mcap) VALUES (?, ?, ?, ?)')
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

  console.log('seeded db successfully')
  console.log(`  contacts: ${contacts.length}`)
  console.log(`  watchlist: ${watchlist.length}`)
  console.log(`  announcements: ${sampleAnns.length}`)
  console.log(`  financials: ${finData.length}`)
}

seed()
