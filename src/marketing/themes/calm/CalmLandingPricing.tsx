import { Link } from 'react-router-dom'

export function CalmLandingPricing() {
  return (
    <section className="section" id="pricing" style={{ paddingTop: 0 }}>
      <div className="section-header section-center">
        <p className="eyebrow">Pricing</p>
        <h2>Designer → Professional → Company</h2>
        <p>All paid plans. Solo business tools without buying team seats.</p>
      </div>
      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="plan-name">Designer</div>
          <div className="plan-price">
            Paid <span>/ mo</span>
          </div>
          <p className="plan-desc">Solo starter — designs, basic client, quote freeze.</p>
          <ul>
            <li>1 seat</li>
            <li>Save designs + project details</li>
            <li>Personal price book</li>
            <li>Freeze issued quotes</li>
          </ul>
          <Link className="btn btn-secondary btn-block" to="/register">
            Register
          </Link>
        </div>
        <div className="pricing-card is-featured">
          <div className="plan-name">Professional</div>
          <div className="plan-price">
            Paid <span>/ mo</span>
          </div>
          <p className="plan-desc">Client history, payment records, outstanding reports.</p>
          <ul>
            <li>1 seat</li>
            <li>Payment schedules &amp; ledger</li>
            <li>Outstanding / overdue</li>
            <li>Full payment history retained</li>
          </ul>
          <Link className="btn btn-primary btn-block" to="/register">
            Register
          </Link>
        </div>
        <div className="pricing-card">
          <div className="plan-name">Company</div>
          <div className="plan-price">Custom</div>
          <p className="plan-desc">Studio / factory — seats, roles, shared projects.</p>
          <ul>
            <li>Multiple seats &amp; roles</li>
            <li>Shared org price book</li>
            <li>Approvals + owner dashboard</li>
            <li>Premium audit views</li>
          </ul>
          <Link className="btn btn-ghost btn-block" to="/login">
            Login to inquire
          </Link>
        </div>
      </div>
    </section>
  )
}
