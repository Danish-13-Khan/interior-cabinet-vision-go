import { Showroom } from '../../showroom/Showroom'
import { Link } from 'react-router-dom'
import { SiteNav } from '../../components/SiteNav'
import { SiteFooter } from '../../components/SiteFooter'
import { ThemeSwitchPanel } from '../../components/ThemeSwitchPanel'
import { templatesCalm } from '../sharedTemplates'
import { CalmLandingPricing } from './CalmLandingPricing'
import { GoldenRunVisual } from './CalmGoldenRunVisual'

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
        <Showroom />
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

      <CalmLandingPricing />

      <SiteFooter />
    </div>
  )
}
