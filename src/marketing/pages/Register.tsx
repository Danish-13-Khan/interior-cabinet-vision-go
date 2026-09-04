import { MarketingShell } from '../components/MarketingShell'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { PasswordField } from '../components/PasswordField'
import { createSession } from '../lib/auth'
import { useTheme } from '../lib/theme'

export function Register() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    createSession({
      email: email.trim() || 'you@showroom.com',
      company: company.trim() || undefined,
      theme,
    })
    navigate('/app')
  }

  const isCalm = theme === 'calm'

  return (
    <MarketingShell>
    <div className="theme-view" key={`register-${theme}`}>
      <div className="auth-page">
        <aside className="auth-brand">
          <Logo style={{ marginBottom: 40 }} />
          <p className="eyebrow">Get started</p>
          <h1>
            {isCalm
              ? 'Proposal-to-production in one workspace.'
              : 'Dense workspace for high-volume sales.'}
          </h1>
          <p>
            {isCalm
              ? 'Create an account to measure rooms, build cabinet runs, price proposals, and hand designs to engineering.'
              : 'Register to manage cabinet jobs in a sidebar + table layout built for scanning and shipping proposals.'}
          </p>
        </aside>
        <div className="auth-panel">
          <div className="auth-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
              <div>
                <h2 style={{ marginBottom: 6 }}>Create your account</h2>
                <p className="auth-sub" style={{ marginBottom: 0 }}>
                  Free Starter plan · upgrade anytime.
                </p>
              </div>
              <ThemeSwitcher size="sm" />
            </div>
            <form onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="first">
                    First name
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    id="first"
                    name="first"
                    placeholder="Alex"
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="last">
                    Last name
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    id="last"
                    name="last"
                    placeholder="Rivera"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="company">
                  Company
                </label>
                <input
                  className="form-input"
                  type="text"
                  id="company"
                  name="company"
                  placeholder="Showroom or dealer name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Work email
                </label>
                <input
                  className="form-input"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@showroom.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <PasswordField
                id="password"
                label="Password"
                value={password}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                onChange={setPassword}
              />
              <p className="form-hint" style={{ marginBottom: 16 }}>
                By registering you agree to the terms of service.
              </p>
              <button type="submit" className="btn btn-primary btn-block btn-lg">
                Register
              </button>
            </form>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </MarketingShell>
  )
}