import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'
import { analyzeCompany, buildFallbackAnalysis, pctChange } from '../../../lib/llm'
import { findRelevantContacts } from '../../../lib/network'

export async function GET(req) {
  try {
    let db = getDb()
    let { searchParams } = new URL(req.url)
    let ticker = searchParams.get('ticker')
    let q = searchParams.get('q')

    if (!ticker && q) {
      let wl = db.prepare('SELECT * FROM watchlist WHERE name LIKE ? OR ticker LIKE ?').all(`%${q}%`, `%${q}%`)
      if (wl.length > 0) ticker = wl[0].ticker
    }

    if (!ticker) {
      let allWl = db.prepare('SELECT * FROM watchlist').all()
      return NextResponse.json({ companies: allWl })
    }

    let company = db.prepare('SELECT * FROM watchlist WHERE ticker = ?').get(ticker)
    let fin = db.prepare('SELECT * FROM financials WHERE ticker = ? ORDER BY id DESC LIMIT 1').get(ticker)
    let recentAnns = db.prepare('SELECT * FROM announcements WHERE ticker = ? ORDER BY published_at DESC LIMIT 5').all(ticker)

    // check cache first
    let cached = db.prepare('SELECT * FROM analysis_cache WHERE ticker = ? AND query_type = ? ORDER BY created_at DESC LIMIT 1').get(ticker, q || 'full')
    let analysis

    if (cached) {
      let cacheAge = (Date.now() - new Date(cached.created_at).getTime()) / 1000 / 60
      if (cacheAge < 60) {
        analysis = JSON.parse(cached.result)
      }
    }

    if (!analysis) {
      analysis = await analyzeCompany(ticker, company?.name || ticker, fin, q)
      // cache it
      db.prepare('INSERT INTO analysis_cache (ticker, query_type, result) VALUES (?, ?, ?)').run(ticker, q || 'full', JSON.stringify(analysis))
    }

    let networkHits = findRelevantContacts(company?.name || '', company?.sector || '', null)

    let financialMetrics = null
    if (fin) {
      financialMetrics = {
        revenue: { value: fin.revenue, qoq: pctChange(fin.revenue, fin.revenue_prev_q), yoy: pctChange(fin.revenue, fin.revenue_prev_y) },
        ebitda: { value: fin.ebitda, qoq: pctChange(fin.ebitda, fin.ebitda_prev_q), yoy: pctChange(fin.ebitda, fin.ebitda_prev_y), margin: ((fin.ebitda / fin.revenue) * 100).toFixed(1) },
        pbt: { value: fin.pbt, qoq: pctChange(fin.pbt, fin.pbt_prev_q), yoy: pctChange(fin.pbt, fin.pbt_prev_y) },
        pat: { value: fin.pat, qoq: pctChange(fin.pat, fin.pat_prev_q), yoy: pctChange(fin.pat, fin.pat_prev_y), margin: ((fin.pat / fin.revenue) * 100).toFixed(1) },
        debt: fin.debt, equity: fin.equity, de: (fin.debt / fin.equity).toFixed(2),
        ocf: fin.ocf, fcf: fin.fcf,
        cashConversion: fin.ocf && fin.pat ? ((fin.ocf / fin.pat) * 100).toFixed(0) : null
      }
    }

    return NextResponse.json({
      company,
      financials: financialMetrics,
      analysis,
      recentAnnouncements: recentAnns.map(a => ({ ...a, detail: (() => { try { return JSON.parse(a.detail) } catch(e) { return null } })() })),
      network: networkHits
    })
  } catch (err) {
    console.error('pull api error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
