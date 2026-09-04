import { Link } from 'react-router-dom'
import { SiteNav } from '../../components/SiteNav'
import { SiteFooter } from '../../components/SiteFooter'
import { ThemeSwitchPanel } from '../../components/ThemeSwitchPanel'
import { templatesCompact } from '../sharedTemplates'

export function CompactLanding() {
  return (
    <div className="theme-view" key="compact-landing">
      <SiteNav />

      <header className="landing-hero-b">
        <p className="eyebrow">Cabinet proposal-to-production</p>
        <h1>Start with the room. Finish with a buildable run.</h1>
        <p className="lead">
          Dense workspace for sales teams who live in jobs tables — measure, design, price, and hand off without leaving
          the run.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-primary btn-lg" to="/login">
            Login
          </Link>
          <Link className="btn btn-secondary btn-lg" to="/register">
            Register
          </Link>
        </div>
        <p className="hero-note" style={{ marginTop: 12 }}>
          Same product. Higher-density chrome for power users.
        </p>
        <ThemeSwitchPanel />

        <div className="hero-b-preview" aria-hidden="true">
          <div className="preview-chrome">
            <div className="preview-side">
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  color: '#6e6e6e',
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                WORKSPACE
              </div>
              <div
                style={{
                  background: 'rgba(125,186,138,0.15)',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#9fd4a8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span>All jobs</span>
                <span style={{ opacity: 0.7 }}>2</span>
              </div>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#a8a8a8',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>In design</span>
                <span style={{ color: '#6e6e6e' }}>0</span>
              </div>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#a8a8a8',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Quoted</span>
                <span style={{ color: '#6e6e6e' }}>0</span>
              </div>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#a8a8a8',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Engineering</span>
                <span style={{ color: '#6e6e6e' }}>0</span>
              </div>
            </div>
            <div className="preview-main">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6e6e6e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Active jobs
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#f2f2f2' }}>Cabinet jobs</div>
                </div>
                <div
                  style={{
                    background: '#7dba8a',
                    color: '#0f1a12',
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: 999,
                  }}
                >
                  + New job
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1.2fr',
                  gap: 8,
                  fontSize: 9,
                  color: '#6e6e6e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  paddingBottom: 8,
                  borderBottom: '1px solid #2a2a2a',
                }}
              >
                <span>Project</span>
                <span>Room</span>
                <span>Rev</span>
                <span>Status</span>
                <span>Updated</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1.2fr',
                  gap: 8,
                  fontSize: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid #232323',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#f2f2f2', fontWeight: 500 }}>Phase 1 — Daylight Sofa</span>
                <span style={{ color: '#a8a8a8' }}>Living Room</span>
                <span style={{ color: '#a8a8a8' }}>Rev A</span>
                <span>
                  <span className="pill" style={{ fontSize: 10 }}>
                    Room
                  </span>
                </span>
                <span style={{ color: '#6e6e6e' }}>23 days ago</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1.2fr',
                  gap: 8,
                  fontSize: 12,
                  padding: '12px 0',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#f2f2f2', fontWeight: 500 }}>L Kitchen remodel</span>
                <span style={{ color: '#a8a8a8' }}>Kitchen</span>
                <span style={{ color: '#a8a8a8' }}>Rev B</span>
                <span>
                  <span className="pill pill-mint" style={{ fontSize: 10 }}>
                    Quoted
                  </span>
                </span>
                <span style={{ color: '#6e6e6e' }}>2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="how">
        <div className="section-header">
          <p className="eyebrow">How it works</p>
          <h2>Pipeline status you can scan</h2>
          <p>Jobs move from design → quoted → engineering without losing the room.</p>
        </div>
        <div className="steps">
          <div className="step">
            <h3>Open a job</h3>
            <p>Name it, pick a template or blank room, land on the canvas in seconds.</p>
          </div>
          <div className="step">
            <h3>Design the run</h3>
            <p>Walls first, then cabinets — status stays In design until you price.</p>
          </div>
          <div className="step">
            <h3>Quote</h3>
            <p>3D + pricing snapshot. Mark Quoted when the customer has a proposal.</p>
          </div>
          <div className="step">
            <h3>Engineering</h3>
            <p>Push the same revision downstream. No re-keying SKUs.</p>
          </div>
        </div>
      </section>

      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <p className="eyebrow">Features</p>
          <h2>Ops-grade density, sales-grade clarity</h2>
          <p>Sidebar filters, searchable jobs, and templates that stay one click away.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">☰</div>
            <h3>Jobs table</h3>
            <p>Project, room, revision, status, and recency — sort and scan like a CRM.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⌂</div>
            <h3>Room → run</h3>
            <p>Measure, draw, place cabinets. Constraints keep runs buildable.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>3D proposals</h3>
            <p>Credible presentations that match the priced line items.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⌕</div>
            <h3>Fast search</h3>
            <p>Find by project name, room, or pipeline status instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⇄</div>
            <h3>Handoff states</h3>
            <p>Workspace filters for In design, Quoted, and Engineering.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⧉</div>
            <h3>Quick templates</h3>
            <p>Expandable template tray under the jobs list — zero context switch.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="golden-run">
          <div className="golden-run-visual" aria-hidden="true">
            <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" width="100%">
              <rect width="360" height="240" fill="#161616" rx="4" />
              <rect x="24" y="30" width="312" height="36" rx="8" fill="#1e1e1e" stroke="#2a2a2a" />
              <text x="40" y="53" fill="#9fd4a8" fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
                Status · Design → Quoted → Engineering
              </text>
              <rect x="24" y="84" width="90" height="120" rx="8" fill="#1a1a1a" stroke="#7dba8a" strokeOpacity="0.4" />
              <text x="42" y="140" fill="#a8a8a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
                In design
              </text>
              <text x="58" y="158" fill="#6e6e6e" fontSize="20" fontFamily="IBM Plex Sans,sans-serif" fontWeight="600">
                0
              </text>
              <rect x="130" y="84" width="90" height="120" rx="8" fill="#1a1a1a" stroke="#7dba8a" />
              <text x="150" y="140" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
                Quoted
              </text>
              <text x="162" y="158" fill="#7dba8a" fontSize="20" fontFamily="IBM Plex Sans,sans-serif" fontWeight="600">
                1
              </text>
              <rect x="236" y="84" width="100" height="120" rx="8" fill="#1a1a1a" stroke="#2a2a2a" />
              <text x="250" y="140" fill="#a8a8a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
                Engineering
              </text>
              <text x="274" y="158" fill="#6e6e6e" fontSize="20" fontFamily="IBM Plex Sans,sans-serif" fontWeight="600">
                0
              </text>
            </svg>
          </div>
          <div>
            <p className="eyebrow">Golden run</p>
            <h3>Pipeline without the redraw tax</h3>
            <p>
              Every status change keeps room geometry, cabinet SKUs, and pricing revision intact — from first sketch to
              shop ticket.
            </p>
            <ul className="golden-checklist">
              <li>Autosave restores unfinished sessions</li>
              <li>Revision letters travel with the job</li>
              <li>Engineering opens the approved Rev</li>
              <li>Library shares templates across the team</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="templates" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <p className="eyebrow">Templates</p>
          <h2>Quick-start shells</h2>
          <p>Drop into a furnished layout or an empty room — edit in 2D and 3D.</p>
        </div>
        <div className="template-grid">
          {templatesCompact.map((t) => (
            <article className="template-card" key={t.title}>
              <div className="template-thumb">{t.svg}</div>
              <div className="template-meta">
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="section-header section-center">
          <p className="eyebrow">Pricing</p>
          <h2>Team-ready from day one</h2>
          <p>Same tiers as Calm — Compact is a layout preference, not a SKU.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="plan-name">Starter</div>
            <div className="plan-price">
              $0 <span>/ mo</span>
            </div>
            <p className="plan-desc">Evaluate on real jobs.</p>
            <ul>
              <li>1 user · 3 jobs</li>
              <li>Templates &amp; PDF</li>
            </ul>
            <Link className="btn btn-secondary btn-block" to="/register">
              Register
            </Link>
          </div>
          <div className="pricing-card is-featured">
            <div className="plan-name">Studio</div>
            <div className="plan-price">
              $79 <span>/ user / mo</span>
            </div>
            <p className="plan-desc">Full golden run for sales.</p>
            <ul>
              <li>Unlimited jobs · 3D</li>
              <li>Pricing · Engineering handoff</li>
            </ul>
            <Link className="btn btn-primary btn-block" to="/register">
              Register
            </Link>
          </div>
          <div className="pricing-card">
            <div className="plan-name">Showroom</div>
            <div className="plan-price">Custom</div>
            <p className="plan-desc">Dealers &amp; manufacturers.</p>
            <ul>
              <li>SSO · catalogs · API</li>
              <li>Dedicated success</li>
            </ul>
            <Link className="btn btn-ghost btn-block" to="/login">
              Login to inquire
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
