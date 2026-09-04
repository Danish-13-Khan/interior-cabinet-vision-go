import { Link } from 'react-router-dom'
import { SiteNav } from '../../components/SiteNav'
import { SiteFooter } from '../../components/SiteFooter'
import { ThemeSwitchPanel } from '../../components/ThemeSwitchPanel'
import { templatesCalm } from '../sharedTemplates'

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect x="40" y="40" width="320" height="220" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="2" rx="2" />
        <rect x="120" y="40" width="80" height="8" fill="#4a6a7a" />
        <rect x="140" y="130" width="100" height="60" fill="#2a3a2e" stroke="#7dba8a" strokeWidth="1.5" rx="2" />
        <text x="170" y="165" fill="#9fd4a8" fontSize="10" fontFamily="IBM Plex Sans,sans-serif">
          Island
        </text>
        <rect x="40" y="40" width="28" height="220" fill="#243028" stroke="#7dba8a" strokeWidth="1" />
        <rect x="40" y="232" width="320" height="28" fill="#243028" stroke="#7dba8a" strokeWidth="1" />
        <rect x="68" y="50" width="50" height="36" fill="#2e4034" stroke="#7dba8a" strokeWidth="0.8" opacity="0.85" />
        <rect x="200" y="50" width="70" height="36" fill="#2e4034" stroke="#7dba8a" strokeWidth="0.8" opacity="0.85" />
        <line x1="40" y1="278" x2="360" y2="278" stroke="#7dba8a" strokeWidth="0.8" opacity="0.5" />
        <text x="180" y="292" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          14&apos;-6&quot;
        </text>
        <text
          x="16"
          y="150"
          fill="#6e6e6e"
          fontSize="9"
          fontFamily="IBM Plex Sans,sans-serif"
          transform="rotate(-90 16 150)"
        >
          11&apos;-0&quot;
        </text>
        <rect x="260" y="100" width="88" height="24" rx="12" fill="rgba(125,186,138,0.2)" stroke="#7dba8a" />
        <text x="274" y="116" fill="#9fd4a8" fontSize="10" fontFamily="IBM Plex Sans,sans-serif" fontWeight="500">
          3D ready
        </text>
      </svg>
    </div>
  )
}

function GoldenRunVisual() {
  return (
    <div className="golden-run-visual" aria-hidden="true">
      <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" width="100%">
        <defs>
          <linearGradient id="calm-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dba8a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7dba8a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="360" height="240" fill="#161616" rx="4" />
        <circle cx="50" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="42" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          1
        </text>
        <line x1="72" y1="120" x2="118" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="140" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="132" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          2
        </text>
        <line x1="162" y1="120" x2="208" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="230" cy="120" r="22" fill="rgba(125,186,138,0.15)" stroke="#7dba8a" />
        <text x="222" y="124" fill="#9fd4a8" fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          3
        </text>
        <line x1="252" y1="120" x2="298" y2="120" stroke="#7dba8a" strokeWidth="2" opacity="0.5" />
        <circle cx="320" cy="120" r="22" fill="#7dba8a" />
        <text x="312" y="124" fill="#0f1a12" fontSize="11" fontFamily="IBM Plex Sans,sans-serif" fontWeight="600">
          4
        </text>
        <text x="28" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Room
        </text>
        <text x="112" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Run
        </text>
        <text x="200" y="170" fill="#6e6e6e" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Proposal
        </text>
        <text x="292" y="170" fill="#9fd4a8" fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Shop
        </text>
        <rect x="20" y="30" width="320" height="40" rx="8" fill="url(#calm-g1)" stroke="#2a2a2a" />
        <text x="40" y="55" fill="#a8a8a8" fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Golden run · same design end-to-end
        </text>
      </svg>
    </div>
  )
}

export function CalmLanding() {
  return (
    <div className="theme-view" key="calm-landing">
      <SiteNav />

      <header className="landing-hero-a">
        <div>
          <p className="eyebrow">Cabinet proposal-to-production</p>
          <h1>
            Start with the room.
            <br />
            Finish with a buildable run.
          </h1>
          <p className="lead">
            Measure and draw the room, build a cabinet run, present credible 3D, price a proposal — then hand the same
            design to engineering.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-primary btn-lg" to="/login">
              Login
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/register">
              Register
            </Link>
          </div>
          <p className="hero-note">Built for salespeople who need proposals that actually build.</p>
          <ThemeSwitchPanel />
        </div>
        <HeroVisual />
      </header>

      <section className="section" id="how">
        <div className="section-header">
          <p className="eyebrow">How it works</p>
          <h2>From tape measure to shop ticket</h2>
          <p>One continuous golden run — no re-drawing between sales and engineering.</p>
        </div>
        <div className="steps">
          <div className="step">
            <h3>Measure &amp; draw</h3>
            <p>Capture walls, openings, and obstacles. Snap a room plan that matches the site.</p>
          </div>
          <div className="step">
            <h3>Build the run</h3>
            <p>Place base, wall, and tall units. Adjust sizes and fillers until the run fits.</p>
          </div>
          <div className="step">
            <h3>Price &amp; propose</h3>
            <p>Generate credible 3D and a priced proposal your customer can trust.</p>
          </div>
          <div className="step">
            <h3>Hand off</h3>
            <p>Send the same design downstream — engineering starts from your approved run.</p>
          </div>
        </div>
      </section>

      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <p className="eyebrow">Features</p>
          <h2>Everything a cabinet salesperson needs</h2>
          <p>Purpose-built for proposal speed without sacrificing buildability.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⌂</div>
            <h3>Room-first canvas</h3>
            <p>Start from real dimensions. Draw walls, doors, windows, and appliances before cabinets.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">▣</div>
            <h3>Buildable cabinet runs</h3>
            <p>Catalog-aware units with fillers, panels, and constraints that keep designs shop-ready.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>Credible 3D</h3>
            <p>Present elevations and walkthroughs that look like the finished kitchen — not a sketch.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">$</div>
            <h3>Live pricing</h3>
            <p>Roll up material and catalog pricing as you design so proposals stay honest.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⇄</div>
            <h3>Engineering handoff</h3>
            <p>One design file from sale to production — no redraw, no lost intent.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⧉</div>
            <h3>Templates library</h3>
            <p>Start from shells or furnished rooms; edit freely in 2D and 3D.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="golden-run">
          <GoldenRunVisual />
          <div>
            <p className="eyebrow">Golden run</p>
            <h3>One design. Sales to shop floor.</h3>
            <p>
              Cabinet Studio keeps the approved proposal identical to the engineering source of truth — so what you sold
              is what gets built.
            </p>
            <ul className="golden-checklist">
              <li>Room plan locked after customer sign-off</li>
              <li>Cabinet run with SKUs and sizes preserved</li>
              <li>Pricing snapshot attached to the proposal</li>
              <li>Engineering opens the same project revision</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="templates" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <p className="eyebrow">Templates</p>
          <h2>Start from a shell or furnished room</h2>
          <p>Editable in 2D and 3D — swap layouts, keep your catalog.</p>
        </div>
        <div className="template-grid">
          {templatesCalm.map((t) => (
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
          <h2>Simple plans for sales teams</h2>
          <p>Start free for one salesperson. Scale when the whole showroom is on board.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="plan-name">Starter</div>
            <div className="plan-price">
              $0 <span>/ mo</span>
            </div>
            <p className="plan-desc">For evaluating the golden run on real jobs.</p>
            <ul>
              <li>1 user</li>
              <li>3 active jobs</li>
              <li>Standard templates</li>
              <li>PDF proposals</li>
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
            <p className="plan-desc">Full proposal-to-production for sales teams.</p>
            <ul>
              <li>Unlimited jobs</li>
              <li>3D presentations</li>
              <li>Live catalog pricing</li>
              <li>Engineering handoff</li>
              <li>Shared library</li>
            </ul>
            <Link className="btn btn-primary btn-block" to="/register">
              Register
            </Link>
          </div>
          <div className="pricing-card">
            <div className="plan-name">Showroom</div>
            <div className="plan-price">Custom</div>
            <p className="plan-desc">Multi-location dealers and manufacturers.</p>
            <ul>
              <li>SSO &amp; roles</li>
              <li>Custom catalogs</li>
              <li>API &amp; ERP hooks</li>
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
