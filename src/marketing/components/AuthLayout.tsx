import { useState, type ReactNode } from 'react'
import { Logo } from './Logo'
import { MarketingShell } from './MarketingShell'

const BASE = import.meta.env.BASE_URL
const POSTER = `${BASE}marketing/showroom-poster.png`
const POSTER_FALLBACK = `${BASE}catalog/templates/l-kitchen-v1.png`

type AuthLayoutProps = {
  eyebrow: string
  title: string
  body: string
  children: ReactNode
  aside?: ReactNode
}

/** Shared light layout for Login and Register: brand panel + form card. */
export function AuthLayout({ eyebrow, title, body, children, aside }: AuthLayoutProps) {
  const [poster, setPoster] = useState(POSTER)
  return (
    <MarketingShell>
      <div className="auth-page">
        <aside className="auth-brand">
          <Logo />
          <div className="auth-brand-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{body}</p>
          </div>
          <figure className="auth-brand-art">
            <img src={poster} alt="" width="960" height="720" decoding="async" onError={() => setPoster(POSTER_FALLBACK)} />
          </figure>
          {aside}
        </aside>
        <main className="auth-panel">
          <div className="auth-card">{children}</div>
        </main>
      </div>
    </MarketingShell>
  )
}
