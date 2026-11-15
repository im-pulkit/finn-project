'use client'

import { useState, useEffect } from 'react'
import Nav from '../../components/Nav'
import NetworkGraph from '../../components/NetworkGraph'

export default function NetworkPage() {
  let [data, setData] = useState(null)
  let [loading, setLoading] = useState(true)
  let [searchQ, setSearchQ] = useState('')
  let [searchResults, setSearchResults] = useState(null)
  let [activeTab, setActiveTab] = useState('map')
  let [selectedContact, setSelectedContact] = useState(null)

  useEffect(() => {
    fetchOverview()
  }, [])

  async function fetchOverview() {
    setLoading(true)
    try {
      let res = await fetch('/api/network')
      let json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQ.trim()) return
    try {
      let res = await fetch(`/api/network?mode=search&q=${encodeURIComponent(searchQ)}`)
      let json = await res.json()
      setSearchResults(json.results)
    } catch (err) {
      console.error(err)
    }
  }

  function clearSearch() {
    setSearchQ('')
    setSearchResults(null)
  }

  let tabs = [
    { id: 'map', label: 'Network Map' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'stale', label: 'Reconnect' },
  ]

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Network</h1>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Your intelligence layer</div>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="pull-input"
              placeholder="Who do I know at... / Expert in..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchResults && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16
                }}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {!searchResults && (
          <div className="tab-bar">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {t.id === 'stale' && data?.staleContacts?.length > 0 && (
                  <span className="badge-count">{data.staleContacts.length}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>
        {searchResults && (
          <div className="fade-in">
            <div className="section-title" style={{ marginTop: 4 }}>
              {searchResults.length} results for "{searchQ}"
            </div>
            {searchResults.length === 0 ? (
              <div className="card" style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>
                No matches in your network
              </div>
            ) : (
              searchResults.map(c => <ContactCard key={c.id} contact={c} showReasons />)
            )}
          </div>
        )}

        {!searchResults && loading && (
          <div>
            <div className="card shimmer" style={{ height: 300 }} />
            <div className="card shimmer" style={{ height: 60 }} />
            <div className="card shimmer" style={{ height: 60 }} />
          </div>
        )}

        {!searchResults && !loading && data && (
          <>
            {activeTab === 'map' && (
              <div className="fade-in">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <NetworkGraph
                    contacts={data.contacts}
                    onSelect={c => setSelectedContact(c)}
                  />
                </div>

                {data.stats && (
                  <div className="metric-grid" style={{ marginTop: 10 }}>
                    <div className="metric-box">
                      <div className="metric-label">Contacts</div>
                      <div className="metric-val">{data.stats.totalContacts}</div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Companies</div>
                      <div className="metric-val">{data.stats.companiesReached}</div>
                    </div>
                  </div>
                )}

                {data.stats?.sectors && (
                  <div className="card" style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>SECTOR COVERAGE</div>
                    {Object.entries(data.stats.sectors).sort((a, b) => b[1] - a[1]).map(([sector, count]) => (
                      <div key={sector} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>{sector}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: count * 30, height: 6, borderRadius: 3,
                            background: 'var(--accent)', opacity: 0.6, transition: 'width 0.3s'
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--muted)', width: 20, textAlign: 'right' }}>{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="fade-in">
                {data.contacts.map(c => <ContactCard key={c.id} contact={c} />)}
              </div>
            )}

            {activeTab === 'stale' && (
              <div className="fade-in">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  People you haven't spoken to in 90+ days
                </div>
                {data.staleContacts && data.staleContacts.length > 0 ? (
                  data.staleContacts.map(c => (
                    <div key={c.id} className="card" style={{ borderLeft: '3px solid var(--orange)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.role} @ {c.company}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {c.daysSince}d ago
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.relationship}</div>
                    </div>
                  ))
                ) : (
                  <div className="card" style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>
                    All contacts recently reached
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Nav />
    </div>
  )
}

function ContactCard({ contact, showReasons }) {
  let [open, setOpen] = useState(false)
  let c = contact

  let avatarColors = ['#22c55e', '#4f8fff', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#f97316']
  let color = avatarColors[c.id % avatarColors.length]

  return (
    <div className="card" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="avatar" style={{ background: color + '25', color }}>
          {c.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.role} @ {c.company}</div>
          {showReasons && c.reasons && c.reasons.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
              {c.reasons.slice(0, 2).join(' • ')}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          {'●'.repeat(c.strength)}{'○'.repeat(5 - (c.strength || 0))}
        </div>
      </div>

      {open && (
        <div className="fade-in" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Via: </span>{c.relationship}
          </div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Sector: </span>{c.sector}
          </div>
          {c.prev_companies && c.prev_companies.length > 0 && (
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)' }}>Prev: </span>{c.prev_companies.join(', ')}
            </div>
          )}
          {c.expertise && c.expertise.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {c.expertise.map((e, i) => (
                <span key={i} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--border)', borderRadius: 4, color: 'var(--muted)' }}>{e}</span>
              ))}
            </div>
          )}
          {c.notes && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>
              {c.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
