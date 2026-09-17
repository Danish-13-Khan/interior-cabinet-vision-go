import { MarketingShell } from '../components/MarketingShell'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { PasswordField } from '../components/PasswordField'
import { createSession } from '../lib/auth'
import { useTheme } from '../lib/theme'

export function Login() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    createSession({
      email: email.trim() || 'you@showroom.com',
      theme,
    })
    navigate('/app')
  }

  const isCalm = theme === 'calm'

  return (
    <MarketingShell>
    <div className="theme-view" key={`login-${theme}`}>
      <div className="auth-page">
        <aside className="auth-brand">
          <Logo style={{ marginBottom: 40 }} />
          <p className="eyebrow">{isCalm ? 'Calm workspace' : 'Compact workspace'}</p>
          <h1>
            {isCalm
              ? 'Start with the room. Finish with a buildable run.'
              : 'Jobs table energy. Golden run discipline.'}
          </h1>
          <p>
            {isCalm
              ? 'Sign in to open your cabinet jobs, restore autosaves, and pick up where you left the canvas.'
              : 'Sign in to filter by pipeline status, restore autosaves, and open the next cabinet job.'}
          </p>
        </aside>
        <div className="auth-panel">
          <div className="auth-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ marginBottom: 6 }}>{isCalm ? 'Welcome back' : 'Log in'}</h2>
                <p className="auth-sub" style={{ marginBottom: 0 }}>
                  {isCalm ? 'Log in to your Cabinet Studio account.' : 'Access your Cabinet Studio workspace.'}
                </p>
              </div>
              <ThemeSwitcher size="sm" />
            </div>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@showroom.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <PasswordField
                id="password"
                label="Password"
                value={password}
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={setPassword}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <input type="checkbox" style={{ accentColor: '#7dba8a' }} /> Remember me
                </label>
                <span style={{ color: 'var(--mint-light)' }}>Forgot password?</span>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg">
                Log in
              </button>
            </form>
            <div className="auth-divider">or</div>
            <Link className="btn btn-secondary btn-block" to="/register">
              Create an account
            </Link>
            <p className="auth-footer">
              Prefer {isCalm ? 'Compact' : 'Calm'}? Use the theme switch above — then continue.
            </p>
          </div>
        </div>
      </div>
    </div>
    </MarketingShell>
  )
}