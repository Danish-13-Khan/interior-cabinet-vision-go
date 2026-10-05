import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { AuthNoticeDialog } from '../components/AuthNoticeDialog'
import { findMarketingTemplate, MARKETING_TEMPLATES, TEMPLATE_QUERY_PARAM } from '../landing/marketingTemplates'
import { stashPendingTemplate } from '../../domain/apartmentTemplates/pendingTemplateHandoff'

const BASE = import.meta.env.BASE_URL

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
}

function TextField({ id, label, value, onChange, type = 'text', placeholder, autoComplete }: TextFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        className="form-input"
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Register() {
  const [params] = useSearchParams()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [templateId, setTemplateId] = useState(() => findMarketingTemplate(params.get(TEMPLATE_QUERY_PARAM))?.id ?? '')
  const [comingSoon, setComingSoon] = useState(false)
  const template = findMarketingTemplate(templateId)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (templateId) stashPendingTemplate(templateId)
    setComingSoon(true)
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Proposal to production in one workspace."
      body="Create an account to measure rooms, build cabinet runs, price proposals and hand designs to engineering."
    >
      <header className="auth-card-head">
        <h2>Create your account</h2>
        <p className="auth-sub">Plans: Designer, Professional and Company.</p>
      </header>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-row">
          <TextField id="first" label="First name" placeholder="Alex" autoComplete="given-name" value={first} onChange={setFirst} />
          <TextField id="last" label="Last name" placeholder="Rivera" autoComplete="family-name" value={last} onChange={setLast} />
        </div>
        <TextField id="company" label="Company" placeholder="Showroom or dealer name" autoComplete="organization" value={company} onChange={setCompany} />
        <TextField id="email" label="Work email" type="email" placeholder="you@showroom.com" autoComplete="email" value={email} onChange={setEmail} />
        <PasswordField
          id="password"
          label="Password"
          value={password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          onChange={setPassword}
        />
        <div className="form-group">
          <label className="form-label" htmlFor="template">Starting template</label>
          <div className="template-pick">
            {template && <img src={`${BASE}${template.image}`} alt="" width="64" height="48" />}
            <select className="form-input" id="template" name="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Blank project</option>
              {MARKETING_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <p className="form-hint">By registering you agree to the terms of service.</p>
        <button type="submit" className="btn btn-primary btn-block btn-lg">Next</button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <AuthNoticeDialog
        open={comingSoon}
        title="Coming soon"
        message={template
          ? `Registration isn't open yet, so no account was created. The editor will offer to start from ${template.name} when you open it again in this browser (kept for about 7 days, including new tabs) — nothing is created until you choose it.`
          : "Registration isn't open yet. You can fill this form, but new accounts aren't created."}
        testId="register-coming-soon"
        onClose={() => setComingSoon(false)}
      />
    </AuthLayout>
  )
}
