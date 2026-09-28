import { Link } from 'react-router-dom'
import { Showroom } from '../showroom/Showroom'

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="container landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="eyebrow">Cabinet design · proposal to production</p>
          <h1 id="landing-hero-title">
            Start with the room.{" "}
            <br />
            Finish with a buildable run.
          </h1>
          <p className="lead">
            Measure and draw the room, build a cabinet run, show it in credible 3D and price the proposal.
            Then hand the same design to the shop.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-primary btn-lg" to="/register">Start free</Link>
            <a className="btn btn-secondary btn-lg" href="#golden-run">Watch the run</a>
          </div>
          <p className="hero-note">Built for cabinet salespeople whose proposals have to build.</p>
        </div>
        <div className="landing-hero-visual">
          <Showroom />
        </div>
      </div>
    </section>
  )
}
