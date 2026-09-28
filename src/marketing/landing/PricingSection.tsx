import { Link } from 'react-router-dom'
import { formatPlanPrice, PRICING_PLANS } from './pricingPlans'

export function PricingSection() {
  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div className="section-header section-center reveal">
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-title">Plans that grow with the shop</h2>
          <p>Designer, Professional and Company. Tell us about your team and we will set you up.</p>
        </div>
        <ul className="pricing-grid">
          {PRICING_PLANS.map((plan) => {
            const price = formatPlanPrice(plan)
            return (
              <li key={plan.id} className={`pricing-card reveal${plan.featured ? ' is-featured' : ''}`}>
                {plan.featured && <span className="pricing-badge">Most popular</span>}
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-price">
                  {price.amount}
                  {price.period && <span> {price.period}</span>}
                </p>
                <p className="plan-desc">{plan.summary}</p>
                <ul className="plan-features">
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <Link className={`btn btn-block ${plan.featured ? 'btn-primary' : 'btn-secondary'}`} to="/register">
                  {price.period ? 'Start free' : 'Talk to us'}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
