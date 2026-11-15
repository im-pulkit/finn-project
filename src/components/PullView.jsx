'use client'

import { useState } from 'react'

export default function PullView({ data }) {
  let [activeSection, setActiveSection] = useState('overview')

  if (!data) return null

  let { company, financials, analysis, recentAnnouncements, network } = data

  let sections = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'numbers', label: '💰 Numbers' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'network', label: '👥 Network' },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }} className="scrollbar-hide">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              background: activeSection === s.id ? 'var(--accent)' : 'var(--card)',
              color: activeSection === s.id ? 'white' : 'var(--muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && <OverviewSection company={company} analysis={analysis} financials={financials} />}
      {activeSection === 'numbers' && <NumbersSection financials={financials} />}
      {activeSection === 'analysis' && <AnalysisSection analysis={analysis} />}
      {activeSection === 'network' && <NetworkSection network={network} company={company} />}
    </div>
  )
}

function OverviewSection({ company, analysis, financials }) {
  return (
    <div>
      {company && (
        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{company.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 8 }}>
            <span>{company.ticker}</span>
            <span>•</span>
            <span>{company.sector}</span>
            <span>•</span>
            <span>{company.mcap}</span>
          </div>
        </div>
      )}

      {analysis?.business_snapshot && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>BUSINESS SNAPSHOT</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{analysis.business_snapshot}</div>
        </div>
      )}

      {financials && (
        <div className="metric-grid" style={{ marginBottom: 10 }}>
          <MetricCard label="Revenue" value={`₹${fmtN(financials.revenue.value)}`} change={financials.revenue.yoy} suffix="YoY" />
          <MetricCard label="EBITDA" value={`₹${fmtN(financials.ebitda.value)}`} change={financials.ebitda.yoy} suffix="YoY" extra={`${financials.ebitda.margin}% margin`} />
          <MetricCard label="PBT" value={`₹${fmtN(financials.pbt.value)}`} change={financials.pbt.yoy} suffix="YoY" />
          <MetricCard label="PAT" value={`₹${fmtN(financials.pat.value)}`} change={financials.pat.yoy} suffix="YoY" extra={`${financials.pat.margin}% margin`} />
        </div>
      )}

      {analysis?.trajectory && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>TRAJECTORY</div>
          {analysis.trajectory.map((t, i) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid var(--accent)', lineHeight: 1.4 }}>
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NumbersSection({ financials }) {
  if (!financials) return <div className="card" style={{ color: 'var(--muted)' }}>No financial data available</div>

  return (
    <div>
      <div className="section-title">P&L Metrics</div>
      <div className="metric-grid">
        <MetricCard label="Revenue" value={`₹${fmtN(financials.revenue.value)}`} change={financials.revenue.yoy} suffix="YoY" />
        <MetricCard label="Revenue QoQ" value={`₹${fmtN(financials.revenue.value)}`} change={financials.revenue.qoq} suffix="QoQ" />
        <MetricCard label="EBITDA" value={`₹${fmtN(financials.ebitda.value)}`} change={financials.ebitda.yoy} suffix="YoY" extra={`${financials.ebitda.margin}% margin`} />
        <MetricCard label="PAT" value={`₹${fmtN(financials.pat.value)}`} change={financials.pat.yoy} suffix="YoY" extra={`${financials.pat.margin}% margin`} />
      </div>

      <div className="section-title">Balance Sheet</div>
      <div className="metric-grid">
        <MetricCard label="Total Debt" value={`₹${fmtN(financials.debt)}`} />
        <MetricCard label="Equity" value={`₹${fmtN(financials.equity)}`} />
        <MetricCard label="D/E Ratio" value={financials.de} extra={parseFloat(financials.de) < 0.5 ? '🟢 Low' : parseFloat(financials.de) < 1.5 ? '🟡 Moderate' : '🔴 High'} />
        <MetricCard label="Cash Conv." value={financials.cashConversion ? `${financials.cashConversion}%` : 'N/A'} extra={parseInt(financials.cashConversion) > 80 ? '🟢 Strong' : '🟡 Watch'} />
      </div>

      <div className="section-title">Cash Flow</div>
      <div className="metric-grid">
        <MetricCard label="Op. Cash Flow" value={`₹${fmtN(financials.ocf)}`} />
        <MetricCard label="Free Cash Flow" value={`₹${fmtN(financials.fcf)}`} />
      </div>
    </div>
  )
}

function AnalysisSection({ analysis }) {
  if (!analysis) return <div className="card" style={{ color: 'var(--muted)' }}>No analysis available</div>

  return (
    <div>
      {analysis.balance_sheet && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>BALANCE SHEET</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
            {analysis.balance_sheet.commentary}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            D/E: <strong>{analysis.balance_sheet.de_ratio}</strong> | Debt: <strong>{analysis.balance_sheet.debt}</strong>
          </div>
        </div>
      )}

      {analysis.cash_quality && (
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>CASH QUALITY</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>{analysis.cash_quality.commentary}</div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            OCF: <strong>{analysis.cash_quality.ocf}</strong> | FCF: <strong>{analysis.cash_quality.fcf}</strong> | Conversion: <strong>{analysis.cash_quality.conversion}</strong>
          </div>
        </div>
      )}

      {(analysis.bull_case || analysis.bear_case) && (
        <div className="bull-bear">
          <div className="bull-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>🐂 BULL CASE</div>
            {(analysis.bull_case || []).map((b, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.4 }}>• {b}</div>
            ))}
          </div>
          <div className="bear-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>🐻 BEAR CASE</div>
            {(analysis.bear_case || []).map((b, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.4 }}>• {b}</div>
            ))}
          </div>
        </div>
      )}

      {analysis.narrative_vs_numbers && (
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, marginBottom: 6 }}>📝 NARRATIVE vs NUMBERS</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>{analysis.narrative_vs_numbers}</div>
        </div>
      )}
    </div>
  )
}

function NetworkSection({ network, company }) {
  if (!network || network.length === 0) {
    return <div className="card" style={{ color: 'var(--muted)', fontSize: 13 }}>No network connections found for {company?.name || 'this company'}</div>
  }

  return (
    <div>
      <div className="card">
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>
          WHO CAN HELP • {company?.name}
        </div>
        {network.map(c => (
          <div className="contact-row" key={c.id}>
            <div className="avatar" style={{ background: getAvatarColor(c.strength) }}>
              {c.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.role} @ {c.company}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                {c.reasons.join(' • ')}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {'●'.repeat(c.strength)}{'○'.repeat(5 - c.strength)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, suffix, extra }) {
  return (
    <div className="metric-box">
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      {change !== undefined && change !== null && (
        <span className={`pct-change ${parseFloat(change) >= 0 ? 'num-up' : 'num-down'}`}>
          {parseFloat(change) >= 0 ? '↑' : '↓'}{Math.abs(parseFloat(change))}% {suffix}
        </span>
      )}
      {extra && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{extra}</div>}
    </div>
  )
}

function fmtN(n) {
  if (!n && n !== 0) return '—'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return n.toLocaleString('en-IN')
  return n
}

function getAvatarColor(strength) {
  let colors = ['#374151', '#374151', '#1e3a5f', '#1e4620', '#4a3520']
  return colors[strength - 1] || colors[0]
}
