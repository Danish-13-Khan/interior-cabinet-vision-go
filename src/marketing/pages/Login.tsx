import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { AuthNoticeDialog } from '../components/AuthNoticeDialog'
import { createSession } from '../lib/auth'
import { localSignInEnabled, postLoginPath, validLocalCredentials } from '../lib/localSignIn'
import { isTauriRuntime } from '../../platform/desktopFiles'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const enabled = localSignInEnabled({
      dev: import.meta.env.DEV,
      desktop: isTauriRuntime(),
      flag: import.meta.env.VITE_LOCAL_AUTH,
    })
    if (!enabled || !validLocalCredentials(email, password)) {
      setFailed(true)
      return
    }
    createSession({ email: email.trim(), theme: 'calm' })
    const from = (location.state as { from?: unknown } | null)?.from
    navigate(postLoginPath(from), { replace: true })
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Start with the room. Finish with a buildable run."
      body="Sign in to open your cabinet jobs, restore autosaves and pick up where you left the canvas."
    >
      <header className="auth-card-head">
        <h2>Welcome back</h2>
        <p className="auth-sub">Log in to your Cabinet Studio account.</p>
      </header>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
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
        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" name="remember" /> Remember me
          </label>
          <span className="auth-muted-link">Forgot password?</span>
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg">Log in</button>
      </form>
      <div className="auth-divider">or</div>
      <Link className="btn btn-secondary btn-block" to="/register">Create an account</Link>
      <AuthNoticeDialog
        open={failed}
        title="Login failed"
        message="We couldn't sign you in. Enter a valid email and a password of at least 8 characters, then try again."
        testId="login-failed"
        onClose={() => setFailed(false)}
      />
    </AuthLayout>
  )
}
