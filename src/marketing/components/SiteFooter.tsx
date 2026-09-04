import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Logo variant="bars" />
      <div className="site-footer-links">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </footer>
  )
}
