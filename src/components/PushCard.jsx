'use client'

import { useState } from 'react'

export default function PushCard({ ann }) {
  let [expanded, setExpanded] = useState(false)
  let detail = ann.detail
  let tagClass = getTagClass(ann.category)
  let categoryLabel = formatCategory(ann.category)

  let timeAgo = getTimeAgo(ann.published_at)

  return (
    <div className="card fade-in" onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`tag ${tagClass}`}>{categoryLabel}</span>
          {ann.importance >= 4 && <span style={{ fontSize: 11, color: '#f59e0b' }}>●</span>}
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{timeAgo}</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.35 }}>
        {ann.title}
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
        {ann.summary}
      </div>

      {ann.category === 'results' && detail && (
        <ResultsDetail detail={detail} />
      )}

      {ann.category === 'management_change' && detail && expanded && (
        <MgmtDetail detail={detail} />
      )}

      {ann.category === 'M&A' && detail && expanded && (
        <MADetail detail={detail} />
      )}

      {ann.hasNetworkMatch && ann.networkContacts && ann.networkContacts.length > 0 && (
        <NetworkHint contacts={ann.networkContacts} company={ann.company} />
      )}

      {expanded && !['results', 'management_change', 'M&A'].includes(ann.category) && detail && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', background: '#0d0d14', borderRadius: 8, padding: 10 }}>
          {Object.entries(detail).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{k.replace(/_/g, ' ')}: </span>
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultsDetail({ detail }) {
  let metrics = [
    { label: 'Revenue', val: detail.revenue, yoy: detail.revenue_yoy, qoq: detail.revenue_qoq },
    { label: 'EBITDA', val: detail.ebitda, yoy: detail.ebitda_yoy, qoq: detail.ebitda_qoq },
    { label: 'PBT', val: detail.pbt, yoy: detail.pbt_yoy, qoq: detail.pbt_qoq },
    { label: 'PAT', val: detail.pat, yoy: detail.pat_yoy, qoq: detail.pat_qoq },
  ]

  return (
    <div className="metric-grid" style={{ marginTop: 10 }}>
      {metrics.map(m => (
        <div className="metric-box" key={m.label}>
          <div className="metric-label">{m.label}</div>
          <div className="metric-val">₹{formatNum(m.val)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <span className={`pct-change ${m.yoy >= 0 ? 'num-up' : 'num-down'}`}>
              {m.yoy >= 0 ? '↑' : '↓'}{Math.abs(m.yoy)}% YoY
            </span>
          </div>
        </div>
      ))}
      {detail.ebitda_margin && (
        <div className="metric-box" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="metric-label">EBITDA Margin</div>
              <div className="metric-val">{detail.ebitda_margin}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MgmtDetail({ detail }) {
  return (
    <div style={{ marginTop: 10, background: '#0d0d14', borderRadius: 8, padding: 10 }}>
      {detail.outgoing && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginBottom: 2 }}>OUTGOING</div>
          <div style={{ fontSize: 13 }}>{detail.outgoing.name} — {detail.outgoing.role}</div>
          {detail.outgoing.tenure && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tenure: {detail.outgoing.tenure}</div>}
        </div>
      )}
      {detail.incoming && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginBottom: 2 }}>INCOMING</div>
          <div style={{ fontSize: 13 }}>{detail.incoming.name} — {detail.incoming.role}</div>
          {detail.incoming.background && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{detail.incoming.background}</div>}
        </div>
      )}
    </div>
  )
}

function MADetail({ detail }) {
  return (
    <div style={{ marginTop: 10, background: '#0d0d14', borderRadius: 8, padding: 10, fontSize: 13 }}>
      <div style={{ marginBottom: 4 }}><strong>Target:</strong> {detail.target}</div>
      <div style={{ marginBottom: 4 }}><strong>Stake:</strong> {detail.stake} | <strong>Value:</strong> ₹{formatNum(detail.value)} Cr</div>
      {detail.rationale && <div style={{ marginBottom: 4, color: 'var(--muted)' }}>{detail.rationale}</div>}
      {detail.expected_close && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Expected close: {detail.expected_close}</div>}
    </div>
  )
}

function NetworkHint({ contacts, company }) {
  return (
    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {contacts.map(c => (
        <div className="network-badge" key={c.id}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>{c.name.split(' ')[0]}</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>• {c.reasons[0]}</span>
        </div>
      ))}
    </div>
  )
}

function getTagClass(cat) {
  let map = {
    'results': 'tag-results',
    'management_change': 'tag-mgmt',
    'M&A': 'tag-ma',
    'litigation': 'tag-litigation',
    'insider_trading': 'tag-insider',
    'dividend': 'tag-dividend',
    'capex': 'tag-capex',
    'fund_raise': 'tag-fundraise',
    'earnings_call': 'tag-results',
    'press_release': 'tag-default',
  }
  return map[cat] || 'tag-default'
}

function formatCategory(cat) {
  let map = {
    'results': 'Results',
    'management_change': 'Mgmt Change',
    'M&A': 'M&A',
    'litigation': 'Litigation',
    'insider_trading': 'Insider',
    'dividend': 'Dividend',
    'capex': 'Capex',
    'fund_raise': 'Fund Raise',
    'earnings_call': 'Earnings Call',
    'press_release': 'Press Release',
    'bonus_split': 'Bonus/Split',
    'pledging': 'Pledging',
    'credit_rating': 'Rating',
  }
  return map[cat] || cat
}

function formatNum(n) {
  if (!n) return '—'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return n.toLocaleString('en-IN')
  return n
}

function getTimeAgo(dateStr) {
  if (!dateStr) return ''
  let d = new Date(dateStr)
  let now = new Date()
  let diff = Math.floor((now - d) / 1000)

  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
