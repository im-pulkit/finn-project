import { NextResponse } from 'next/server'
import { searchNetwork, getNetworkStats, findRelevantContacts } from '../../../lib/network'
import { getDb } from '../../../lib/db'

export async function GET(req) {
  try {
    let { searchParams } = new URL(req.url)
    let q = searchParams.get('q')
    let mode = searchParams.get('mode') || 'overview'

    if (mode === 'search' && q) {
      let results = searchNetwork(q)
      return NextResponse.json({ results, query: q })
    }

    if (mode === 'expertise') {
      let topic = q || ''
      let results = searchNetwork(topic)
      return NextResponse.json({ experts: results, topic })
    }

    if (mode === 'company') {
      let results = findRelevantContacts(q, null, null)
      return NextResponse.json({ contacts: results, company: q })
    }

    // overview mode
    let stats = getNetworkStats()
    let db = getDb()
    let contacts = db.prepare('SELECT * FROM contacts ORDER BY strength DESC').all()
    let parsed = contacts.map(c => ({
      ...c,
      prev_companies: JSON.parse(c.prev_companies || '[]'),
      expertise: JSON.parse(c.expertise || '[]')
    }))

    return NextResponse.json({
      stats,
      contacts: parsed,
      staleContacts: stats.staleContacts
    })
  } catch (err) {
    console.error('network api error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
