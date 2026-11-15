import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'
import { findRelevantContacts, getReconnectSuggestions } from '../../../lib/network'

export async function GET(req) {
  try {
    let db = getDb()
    let { searchParams } = new URL(req.url)
    let filter = searchParams.get('category')
    let limit = parseInt(searchParams.get('limit') || '20')

    let query = 'SELECT * FROM announcements'
    let params = []
    if (filter && filter !== 'all') {
      query += ' WHERE category = ?'
      params.push(filter)
    }
    query += ' ORDER BY importance DESC, published_at DESC LIMIT ?'
    params.push(limit)

    let announcements = db.prepare(query).all(...params)

    // enrich with network info
    let enriched = announcements.map(ann => {
      let networkHits = findRelevantContacts(ann.company, null, null)
      let detail = null
      try { detail = JSON.parse(ann.detail) } catch(e) {}

      return {
        ...ann,
        detail,
        networkContacts: networkHits.slice(0, 2),
        hasNetworkMatch: networkHits.length > 0
      }
    })

    let reconnects = getReconnectSuggestions(announcements.slice(0, 5))

    return NextResponse.json({
      announcements: enriched,
      reconnectSuggestions: reconnects,
      total: enriched.length
    })
  } catch (err) {
    console.error('push api error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
