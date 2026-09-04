import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeSwitcher } from './ThemeSwitcher'
import { clearSession, getSession } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

export function AppTopbar() {
  const session = getSession()
  const navigate = useNavigate()
  const initial = (session?.email?.[0] ?? 'U').toUpperCase()

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        <Logo to="/app" />
        <nav className="app-topbar-nav">
          <Link className="is-active" to="/app">
            Projects
          </Link>
          <a
            href="#library"
            onClick={(e) => {
              e.preventDefault()
            }}
          >
            Library
          </a>
        </nav>
      </div>
      <div className="app-topbar-right">
        <ThemeSwitcher size="sm" />
        {session && (
          <div className="user-chip" title={session.email}>
            <span className="avatar">{initial}</span>
            <span>{session.company || session.email.split('@')[0]}</span>
          </div>
        )}
        <Link className="btn btn-ghost btn-sm" to="/">
          Marketing
        </Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  )
}
