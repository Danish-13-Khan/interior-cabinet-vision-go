import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'

type SiteMenuSheetProps = {
  links: readonly { href: string; label: string }[]
  onClose: () => void
}

/** Phone navigation sheet: focus-trapped dialog that closes on Escape, backdrop tap or link choice. */
export function SiteMenuSheet({ links, onClose }: SiteMenuSheetProps) {
  const sheet = useRef<HTMLDivElement>(null)
  useDialogFocusTrap(true, sheet, onClose, 'site-nav-menu')

  return (
    <div className="site-menu-backdrop" onClick={onClose}>
      <div
        ref={sheet}
        id="site-menu-sheet"
        className="site-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="site-menu-head">
          <span className="site-menu-title">Menu</span>
          <button type="button" className="site-menu-close" aria-label="Close menu" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile">
          <ul className="site-menu-links">
            {links.map((link) => (
              <li key={link.href}><a href={link.href} onClick={onClose}>{link.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="site-menu-cta">
          <Link className="btn btn-primary btn-lg btn-block" to="/register" onClick={onClose}>Start free</Link>
          <Link className="btn btn-secondary btn-lg btn-block" to="/login" onClick={onClose}>Log in</Link>
        </div>
      </div>
    </div>
  )
}
