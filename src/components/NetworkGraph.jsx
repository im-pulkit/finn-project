'use client'

import { useEffect, useRef, useState } from 'react'

export default function NetworkGraph({ contacts, onSelect }) {
  let canvasRef = useRef(null)
  let [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!contacts || contacts.length === 0) return
    let canvas = canvasRef.current
    if (!canvas) return

    let ctx = canvas.getContext('2d')
    let w = canvas.width = canvas.parentElement.clientWidth
    let h = canvas.height = 300

    let centerX = w / 2
    let centerY = h / 2
    let radius = Math.min(w, h) / 2 - 50

    ctx.clearRect(0, 0, w, h)

    // draw center node (you)
    ctx.beginPath()
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#4f8fff'
    ctx.fill()
    ctx.font = '10px -apple-system, sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('YOU', centerX, centerY)

    let nodes = contacts.map((c, i) => {
      let angle = (i / contacts.length) * Math.PI * 2 - Math.PI / 2
      let dist = radius * (0.6 + (c.strength / 5) * 0.4)
      let x = centerX + Math.cos(angle) * dist
      let y = centerY + Math.sin(angle) * dist
      return { ...c, x, y, angle }
    })

    // draw edges
    for (let node of nodes) {
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(node.x, node.y)
      ctx.strokeStyle = `rgba(79, 143, 255, ${0.1 + node.strength * 0.06})`
      ctx.lineWidth = node.strength > 3 ? 2 : 1
      ctx.stroke()
    }

    // draw second-degree connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let a = nodes[i]
        let b = nodes[j]
        let prevA = a.prev_companies || []
        let prevB = b.prev_companies || []
        let shared = prevA.some(c => prevB.includes(c)) || a.sector === b.sector
        if (shared) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)'
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }

    // draw nodes
    for (let node of nodes) {
      let sectorColors = {
        'IT Services': '#22c55e',
        'Banking': '#4f8fff',
        'Conglomerate': '#f59e0b',
        'Consumer': '#a855f7',
        'NBFC': '#3b82f6',
        'Logistics': '#f97316',
        'Defence': '#6b7280',
        'Healthcare': '#ec4899',
        'Specialty Chemicals': '#14b8a6',
        'Agrochemicals': '#84cc16'
      }

      let nodeColor = sectorColors[node.sector] || '#6b6b80'
      let nodeR = 10 + node.strength * 2

      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2)
      ctx.fillStyle = nodeColor + '40'
      ctx.fill()
      ctx.strokeStyle = nodeColor
      ctx.lineWidth = 1.5
      ctx.stroke()

      let initials = node.name.split(' ').map(n => n[0]).join('')
      ctx.font = `bold ${nodeR > 14 ? 10 : 8}px -apple-system, sans-serif`
      ctx.fillStyle = nodeColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initials, node.x, node.y)

      // name below
      ctx.font = '9px -apple-system, sans-serif'
      ctx.fillStyle = '#6b6b80'
      ctx.fillText(node.name.split(' ')[0], node.x, node.y + nodeR + 10)
    }

    // handle clicks
    let handleClick = (e) => {
      let rect = canvas.getBoundingClientRect()
      let mx = e.clientX - rect.left
      let my = e.clientY - rect.top

      for (let node of nodes) {
        let dx = mx - node.x
        let dy = my - node.y
        if (dx * dx + dy * dy < 400) {
          setSelected(node)
          if (onSelect) onSelect(node)
          return
        }
      }
      setSelected(null)
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [contacts])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 300 }} />
      {selected && (
        <div className="card fade-in" style={{ marginTop: -10, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected.role}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected.company}</div>
            </div>
            <div style={{ fontSize: 12 }}>
              {'●'.repeat(selected.strength)}{'○'.repeat(5 - selected.strength)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>{selected.relationship}</div>
          {selected.expertise && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {selected.expertise.map((e, i) => (
                <span key={i} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--border)', borderRadius: 4 }}>{e}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
