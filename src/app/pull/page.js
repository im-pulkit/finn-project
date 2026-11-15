'use client'

import { useState, useEffect } from 'react'
import Nav from '../../components/Nav'
import PullView from '../../components/PullView'

export default function PullPage() {
  let [query, setQuery] = useState('')
  let [companies, setCompanies] = useState([])
  let [selectedTicker, setSelectedTicker] = useState(null)
  let [pullData, setPullData] = useState(null)
  let [loading, setLoading] = useState(false)
  let [searchMode, setSearchMode] = useState(true)

  useEffect(() => {
    fetch('/api/pull')
      .then(r => r.json())
      .then(d => setCompanies(d.companies || []))
      .catch(err => console.error(err))
  }, [])

  async function doSearch(ticker) {
    setLoading(true)
    setSearchMode(false)
    setSelectedTicker(ticker)
    try {
      let res = await fetch(`/api/pull?ticker=${encodeURIComponent(ticker)}`)
      let json = await res.json()
      setPullData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearchMode(false)
    try {
      let res = await fetch(`/api/pull?q=${encodeURIComponent(query)}`)
      let json = await res.json()
      if (json.companies) {
        setSearchMode(true)
        setCompanies(json.companies)
      } else {
        setPullData(json)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  function goBack() {
    setSearchMode(true)
    setPullData(null)
    setSelectedTicker(null)
    setQuery('')
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {!searchMode && (
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', padding: '4px 0' }}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Pull</h1>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Company Research</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <input
            type="text"
            className="pull-input"
            placeholder="Search company or ask a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div style={{ padding: '0 16px' }}>
        {loading && (
          <div>
            <div className="card shimmer" style={{ height: 80 }} />
            <div className="card shimmer" style={{ height: 160 }} />
            <div className="card shimmer" style={{ height: 120 }} />
          </div>
        )}

        {searchMode && !loading && companies.length > 0 && (
          <div>
            <div className="section-title" style={{ marginTop: 4 }}>Watchlist</div>
            {companies.map(c => (
              <div
                key={c.ticker}
                className="card"
                onClick={() => doSearch(c.ticker)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.ticker} • {c.sector}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.mcap}</div>
              </div>
            ))}
          </div>
        )}

        {!searchMode && !loading && pullData && (
          <PullView data={pullData} />
        )}
      </div>

      <Nav />
    </div>
  )
}
