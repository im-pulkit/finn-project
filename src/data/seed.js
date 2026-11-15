const { getDb } = require('../lib/db')
const contacts = require('./contacts.json')
const watchlist = require('./watchlist.json')

function seed() {
  let db = getDb()

  db.exec('DELETE FROM contacts')
  db.exec('DELETE FROM watchlist')
  db.exec('DELETE FROM announcements')
  db.exec('DELETE FROM financials')

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

  // seed some announcements
  let insertAnn = db.prepare(`
    INSERT INTO announcements (company, ticker, category, title, summary, detail, importance, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let sampleAnns = [
    {
      company: 'Tata Consultancy Services', ticker: 'TCS.NS', category: 'results',
      title: 'Q2 FY27 Results - Revenue up 5.2% YoY',
      summary: 'TCS reported Q2 FY27 revenue of ₹64,259 Cr, up 5.2% YoY. EBITDA margin at 26.8%, PAT at ₹12,380 Cr.',
      detail: JSON.stringify({
        revenue: 64259, ebitda: 17221, pbt: 15890, pat: 12380,
        revenue_qoq: 2.1, ebitda_qoq: 1.8, pbt_qoq: 2.3, pat_qoq: 2.0,
        revenue_yoy: 5.2, ebitda_yoy: 4.8, pbt_yoy: 5.1, pat_yoy: 4.5,
        ebitda_margin: 26.8
      }),
      importance: 5, published_at: '2026-11-14T18:30:00'
    },
    {
      company: 'HDFC Bank', ticker: 'HDFCBANK.NS', category: 'management_change',
      title: 'CFO Srinivasan Vaidyanathan steps down; Kaizad Bharucha named interim',
      summary: 'HDFC Bank CFO Srinivasan Vaidyanathan resigned citing personal reasons. Kaizad Bharucha, currently Executive Director, to serve as interim CFO.',
      detail: JSON.stringify({
        outgoing: { name: 'Srinivasan Vaidyanathan', role: 'CFO', tenure: '7 years' },
        incoming: { name: 'Kaizad Bharucha', role: 'Interim CFO', background: 'Executive Director at HDFC Bank since 2019. Previously at Deutsche Bank and Citi. IIM Ahmedabad alumnus.' }
      }),
      importance: 5, published_at: '2026-11-14T10:15:00'
    },
    {
      company: 'Reliance Industries', ticker: 'RELIANCE.NS', category: 'M&A',
      title: 'RIL acquires 51% stake in Shubhalakshmi Polyesters for ₹1,522 Cr',
      summary: 'Reliance acquires majority stake in Shubhalakshmi Polyesters, a polyester yarn manufacturer, to expand downstream integration.',
      detail: JSON.stringify({
        target: 'Shubhalakshmi Polyesters Ltd',
        stake: '51%', value: 1522,
        rationale: 'Downstream polyester value chain integration',
        expected_close: 'Q4 FY27'
      }),
      importance: 4, published_at: '2026-11-13T14:00:00'
    },
    {
      company: 'Bajaj Finance', ticker: 'BAJFINANCE.NS', category: 'results',
      title: 'Q2 FY27 - AUM grows 28%, NII up 22% YoY',
      summary: 'Bajaj Finance AUM at ₹3.45L Cr. NII ₹9,180 Cr up 22% YoY. Provisions higher at ₹1,890 Cr as Stage 2 assets rose.',
      detail: JSON.stringify({
        revenue: 17250, ebitda: 10420, pbt: 6230, pat: 4680,
        revenue_qoq: 4.5, ebitda_qoq: 3.2, pbt_qoq: -1.8, pat_qoq: -2.1,
        revenue_yoy: 22.0, ebitda_yoy: 18.5, pbt_yoy: 12.3, pat_yoy: 11.8,
        ebitda_margin: 60.4
      }),
      importance: 5, published_at: '2026-11-13T18:00:00'
    },
    {
      company: 'Titan Company', ticker: 'TITAN.NS', category: 'capex',
      title: 'Board approves ₹2,400 Cr capex for new jewellery manufacturing facility',
      summary: 'Titan to set up a new jewellery manufacturing unit in Pantnagar, Uttarakhand. Expected commissioning by H2 FY28.',
      detail: JSON.stringify({
        amount: 2400, location: 'Pantnagar, Uttarakhand',
        type: 'New jewellery manufacturing facility',
        timeline: 'H2 FY28'
      }),
      importance: 3, published_at: '2026-11-12T16:30:00'
    },
    {
      company: 'State Bank of India', ticker: 'SBIN.NS', category: 'dividend',
      title: 'SBI declares interim dividend of ₹13.70 per share',
      summary: 'Board declared interim dividend. Record date set for 28 November 2026.',
      detail: JSON.stringify({
        amount_per_share: 13.70, record_date: '2026-11-28',
        type: 'Interim dividend'
      }),
      importance: 3, published_at: '2026-11-12T11:00:00'
    },
    {
      company: 'Infosys', ticker: 'INFY.NS', category: 'insider_trading',
      title: 'Promoter Nandan Nilekani sells 15 lakh shares worth ₹280 Cr',
      summary: 'Co-founder Nandan Nilekani sold shares via block deal on NSE. Post-sale holding at 1.2%.',
      detail: JSON.stringify({
        person: 'Nandan Nilekani', designation: 'Co-founder & Non-Executive Chairman',
        shares_sold: 1500000, value_cr: 280, post_holding_pct: 1.2
      }),
      importance: 3, published_at: '2026-11-11T09:45:00'
    },
    {
      company: 'Hindustan Aeronautics', ticker: 'HAL.NS', category: 'press_release',
      title: 'HAL signs ₹26,000 Cr contract for 12 Su-30MKI jets with IAF',
      summary: 'Major defence order for new-build Su-30MKI aircraft. Deliveries to commence from 2028.',
      detail: JSON.stringify({
        order_value: 26000, product: '12 Su-30MKI fighter jets',
        customer: 'Indian Air Force', delivery_start: '2028'
      }),
      importance: 4, published_at: '2026-11-11T15:30:00'
    },
    {
      company: 'HDFC Bank', ticker: 'HDFCBANK.NS', category: 'results',
      title: 'Q2 FY27 Results - NII up 9.3% YoY to ₹30,110 Cr',
      summary: 'HDFC Bank reports steady Q2. Net interest income ₹30,110 Cr. PAT ₹17,260 Cr up 11.4% YoY. CASA ratio stable at 38.2%.',
      detail: JSON.stringify({
        revenue: 30110, ebitda: 22580, pbt: 21940, pat: 17260,
        revenue_qoq: 3.1, ebitda_qoq: 2.8, pbt_qoq: 3.5, pat_qoq: 3.2,
        revenue_yoy: 9.3, ebitda_yoy: 8.7, pbt_yoy: 10.1, pat_yoy: 11.4,
        ebitda_margin: 75.0
      }),
      importance: 5, published_at: '2026-11-10T18:30:00'
    },
    {
      company: 'Reliance Industries', ticker: 'RELIANCE.NS', category: 'earnings_call',
      title: 'Q2 FY27 Earnings Call Transcript available',
      summary: 'Management discussed Jio subscriber additions, retail expansion and new energy timeline. Guided 15% EBITDA growth for FY27.',
      detail: JSON.stringify({
        highlights: [
          'Jio net adds 8.2M in Q2, ARPU at ₹203',
          'Retail revenue up 18% YoY, 400 new stores',
          'New energy capex on track, ₹12,000 Cr deployed in H1',
          'Guided 15% consolidated EBITDA growth for FY27'
        ]
      }),
      importance: 4, published_at: '2026-11-10T12:00:00'
    },
    {
      company: 'Titan Company', ticker: 'TITAN.NS', category: 'results',
      title: 'Q2 FY27 Results - Revenue up 20% YoY driven by jewellery',
      summary: 'Revenue ₹14,780 Cr up 20% YoY. Jewellery segment grew 23%. EBITDA margin at 12.1%. PAT ₹1,150 Cr up 18% YoY.',
      detail: JSON.stringify({
        revenue: 14780, ebitda: 1788, pbt: 1480, pat: 1150,
        revenue_qoq: 8.3, ebitda_qoq: 6.1, pbt_qoq: 5.8, pat_qoq: 5.2,
        revenue_yoy: 20.0, ebitda_yoy: 16.5, pbt_yoy: 17.2, pat_yoy: 18.0,
        ebitda_margin: 12.1
      }),
      importance: 4, published_at: '2026-11-09T18:30:00'
    },
    {
      company: 'SRF Limited', ticker: 'SRF.NS', category: 'litigation',
      title: 'NCLAT orders stay on ₹375 Cr penalty by CCI',
      summary: 'CCI had imposed penalty alleging cartel pricing in refrigerant gases. SRF obtained stay from NCLAT. Next hearing Feb 2027.',
      detail: JSON.stringify({
        amount: 375, body: 'CCI', allegation: 'Cartel pricing in refrigerant gases',
        status: 'Stay obtained from NCLAT', next_hearing: 'Feb 2027'
      }),
      importance: 3, published_at: '2026-11-09T14:00:00'
    }
  ]

  for (let a of sampleAnns) {
    insertAnn.run(a.company, a.ticker, a.category, a.title, a.summary, a.detail, a.importance, a.published_at)
  }

  // seed financials
  let insertFin = db.prepare(`
    INSERT INTO financials (ticker, period, revenue, ebitda, pbt, pat, revenue_prev_q, ebitda_prev_q, pbt_prev_q, pat_prev_q, revenue_prev_y, ebitda_prev_y, pbt_prev_y, pat_prev_y, debt, equity, ocf, fcf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let finData = [
    { ticker: 'TCS.NS', period: 'Q2FY27', revenue: 64259, ebitda: 17221, pbt: 15890, pat: 12380, rq: 62932, eq: 16917, pq: 15535, paq: 12135, ry: 61098, ey: 16433, py: 15121, pay: 11843, debt: 1200, equity: 89500, ocf: 13500, fcf: 11200 },
    { ticker: 'HDFCBANK.NS', period: 'Q2FY27', revenue: 30110, ebitda: 22580, pbt: 21940, pat: 17260, rq: 29200, eq: 21960, pq: 21200, paq: 16720, ry: 27560, ey: 20770, py: 19930, pay: 15495, debt: 0, equity: 465000, ocf: 0, fcf: 0 },
    { ticker: 'BAJFINANCE.NS', period: 'Q2FY27', revenue: 17250, ebitda: 10420, pbt: 6230, pat: 4680, rq: 16510, eq: 10095, pq: 6344, paq: 4780, ry: 14140, ey: 8790, py: 5550, pay: 4186, debt: 78000, equity: 52000, ocf: 5200, fcf: 4100 },
    { ticker: 'TITAN.NS', period: 'Q2FY27', revenue: 14780, ebitda: 1788, pbt: 1480, pat: 1150, rq: 13647, eq: 1685, pq: 1399, paq: 1093, ry: 12317, ey: 1535, py: 1263, pay: 975, debt: 4200, equity: 12500, ocf: 1100, fcf: 780 },
    { ticker: 'RELIANCE.NS', period: 'Q2FY27', revenue: 265000, ebitda: 47800, pbt: 23500, pat: 19878, rq: 258000, eq: 46200, pq: 22800, paq: 19230, ry: 243000, ey: 42500, py: 21000, pay: 17700, debt: 285000, equity: 580000, ocf: 35000, fcf: 18000 }
  ]

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
