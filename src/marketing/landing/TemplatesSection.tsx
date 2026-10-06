import { Link } from 'react-router-dom'
import { MARKETING_TEMPLATES, registerHrefForTemplate } from './marketingTemplates'

const BASE = import.meta.env.BASE_URL

export function TemplatesSection() {
  return (
    <section className="section section-alt" id="templates" aria-labelledby="templates-title">
      <div className="container">
        <div className="section-header reveal">
          <p className="eyebrow">Templates</p>
          <h2 id="templates-title">Start from a shell or a furnished room</h2>
          <p>Pick a starting point. Everything stays editable in 2D and 3D.</p>
        </div>
        <ul className="template-grid">
          {MARKETING_TEMPLATES.map((template) => (
            <li key={template.id} className="reveal">
              <Link className="template-card" to={registerHrefForTemplate(template.id)} data-template-id={template.id}>
                <span className="template-thumbs">
                  <img className="template-thumb" src={`${BASE}${template.image}`} alt="" width="640" height="480" loading="lazy" decoding="async" />
                  {template.planImage ? (
                    <img className="template-thumb template-thumb-plan" src={`${BASE}${template.planImage}`} alt="" width="640" height="480" loading="lazy" decoding="async" />
                  ) : null}
                </span>
                <span className="template-meta">
                  <strong>{template.name}</strong>
                  <span>{template.blurb}</span>
                  <span className="template-cta" aria-hidden="true">Start with this →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
