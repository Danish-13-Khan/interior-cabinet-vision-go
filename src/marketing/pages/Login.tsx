import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
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
        message="We couldn't sign you in. Check your email and password, then try again."
        testId="login-failed"
        onClose={() => setFailed(false)}
      />
    </AuthLayout>
  )
}
