import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <Logo variant="bars" />
        <nav className="site-footer-links" aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
        </nav>
        <p className="site-footer-note">© {new Date().getFullYear()} Cabinet Studio</p>
      </div>
    </footer>
  )
}
