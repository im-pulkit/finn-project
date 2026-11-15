'use client'

import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import PushCard from '../components/PushCard'

export default function PushPage() {
  let [data, setData] = useState(null)
  let [loading, setLoading] = useState(true)
  let [filter, setFilter] = useState('all')
  let [reconnects, setReconnects] = useState([])

  useEffect(() => {
    fetchData()
  }, [filter])

  async function fetchData() {
    setLoading(true)
    try {
      let res = await fetch(`/api/push?category=${filter}`)
      let json = await res.json()
      setData(json.announcements || [])
      setReconnects(json.reconnectSuggestions || [])
    } catch (err) {
      console.error(err)
      setData([])
    }
    setLoading(false)
  }

  let filters = [
    { val: 'all', label: 'All' },
    { val: 'results', label: 'Results' },
    { val: 'management_change', label: 'Mgmt' },
    { val: 'M&A', label: 'M&A' },
    { val: 'earnings_call', label: 'Calls' },
    { val: 'capex', label: 'Capex' },
    { val: 'litigation', label: 'Legal' },
  ]

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>FINN</h1>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Push Intelligence</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{data ? data.length : '—'} updates</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }} className="scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: 'none',
                background: filter === f.val ? 'var(--accent)' : 'var(--card)',
                color: filter === f.val ? 'white' : 'var(--muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {reconnects.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginTop: 0 }}>Reconnect</div>
            {reconnects.slice(0, 2).map((r, i) => (
              <div key={i} className="card" style={{ borderColor: '#4f8fff30', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>
                  🔗 {r.contact.name} • {r.daysSince}d since last contact
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {r.reason}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="card shimmer" style={{ height: 120 }} />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          data.map((ann, i) => <PushCard key={ann.id || i} ann={ann} />)
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
            No announcements found
          </div>
        )}
      </div>

      <Nav />
    </div>
  )
}
