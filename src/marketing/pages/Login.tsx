import { MarketingShell } from '../components/MarketingShell'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { PasswordField } from '../components/PasswordField'
import { AuthNoticeDialog } from '../components/AuthNoticeDialog'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFailed(true)
  }

  return (
    <MarketingShell>
    <div className="theme-view">
      <div className="auth-page">
        <aside className="auth-brand">
          <Logo style={{ marginBottom: 40 }} />
          <p className="eyebrow">Calm workspace</p>
          <h1>
            Start with the room. Finish with a buildable run.
          </h1>
          <p>
            Sign in to open your cabinet jobs, restore autosaves, and pick up where you left the canvas.
          </p>
        </aside>
        <div className="auth-panel">
          <div className="auth-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
                <p className="auth-sub" style={{ marginBottom: 0 }}>
                  Log in to your Cabinet Studio account.
                </p>
              </div>
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
          </div>
        </div>
      </div>
      <AuthNoticeDialog
        open={failed}
        title="Login failed"
        message="We couldn't sign you in. Check your email and password, then try again."
        testId="login-failed"
        onClose={() => setFailed(false)}
      />
    </div>
    </MarketingShell>
  )
}