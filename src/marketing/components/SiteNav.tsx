import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeSwitcher } from './ThemeSwitcher'

export function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="site-nav-left">
        <Logo />
        <div className="site-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
        </div>
      </div>
      <div className="site-nav-cta">
        <ThemeSwitcher size="sm" />
        <Link className="btn btn-ghost btn-sm" to="/login">
          Login
        </Link>
        <Link className="btn btn-primary btn-sm" to="/register">
          Register
        </Link>
      </div>
    </nav>
  )
}
