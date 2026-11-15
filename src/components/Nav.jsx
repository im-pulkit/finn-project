'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function Nav() {
  let path = usePathname()
  let router = useRouter()

  let items = [
    { href: '/', label: 'Push', icon: pushIcon },
    { href: '/pull', label: 'Pull', icon: pullIcon },
    { href: '/network', label: 'Network', icon: networkIcon },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.href}
          className={`nav-item ${path === item.href ? 'active' : ''}`}
          onClick={() => router.push(item.href)}
        >
          {item.icon()}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function pushIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function pullIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function networkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
