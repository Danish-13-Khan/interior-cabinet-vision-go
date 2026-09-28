import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { SiteMenuSheet } from './SiteMenuSheet'

export const SITE_NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#templates', label: 'Templates' },
  { href: '#pricing', label: 'Pricing' },
] as const

const PHONE_QUERY = '(max-width: 767px)'

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const media = window.matchMedia(PHONE_QUERY)
    const close = () => { if (!media.matches) setMenuOpen(false) }
    media.addEventListener('change', close)
    return () => media.removeEventListener('change', close)
  }, [menuOpen])

  return (
    <>
    <header className="site-header">
      <div className="container site-nav">
        <Logo />
        <nav className="site-nav-links" aria-label="Primary">
          {SITE_NAV_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="site-nav-cta">
          <Link className="btn btn-ghost btn-sm" to="/login">Log in</Link>
          <Link className="btn btn-primary btn-sm" to="/register">Start free</Link>
        </div>
        <button
          type="button"
          className="site-nav-menu"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu-sheet"
          data-testid="site-nav-menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
    {menuOpen && <SiteMenuSheet links={SITE_NAV_LINKS} onClose={() => setMenuOpen(false)} />}
    </>
  )
}
