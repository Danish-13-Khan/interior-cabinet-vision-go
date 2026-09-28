import { Link } from 'react-router-dom'
import { SiteNav } from '../components/SiteNav'
import { SiteFooter } from '../components/SiteFooter'
import { LandingHero } from './LandingHero'
import { HowItWorks } from './HowItWorks'
import { FeatureGrid } from './FeatureGrid'
import { GoldenRunStrip } from './GoldenRunStrip'
import { TemplatesSection } from './TemplatesSection'
import { PricingSection } from './PricingSection'

export function LandingPage() {
  return (
    <div className="landing">
      <SiteNav />
      <main>
        <LandingHero />
        <HowItWorks />
        <FeatureGrid />
        <GoldenRunStrip />
        <TemplatesSection />
        <PricingSection />
        <section className="cta-band" aria-labelledby="cta-title">
          <div className="container cta-band-inner reveal">
            <h2 id="cta-title">Draw the room. Sell the run. Build it once.</h2>
            <div className="hero-ctas">
              <Link className="btn btn-primary btn-lg" to="/register">Start free</Link>
              <Link className="btn btn-secondary btn-lg" to="/login">Log in</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
