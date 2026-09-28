import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

type LogoProps = {
  to?: string
  variant?: 'mark' | 'bars'
  style?: CSSProperties
}

export function Logo({ to = '/', variant = 'mark', style }: LogoProps) {
  const mark =
    variant === 'bars' ? (
      <span className="logo-bars" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    ) : (
      <span className="logo-mark" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    )

  return (
    <Link to={to} className="logo" style={style}>
      {mark}
      Cabinet Studio
    </Link>
  )
}
