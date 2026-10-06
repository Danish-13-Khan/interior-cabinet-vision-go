import { Link } from 'react-router-dom'
import { TemplateCardPoster } from '../../components/livingRoomPlan/TemplateCardPoster'
import type { TemplateCardId } from '../../domain/templateCardMedia'
import { MARKETING_TEMPLATES, registerHrefForTemplate } from './marketingTemplates'

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
                  <TemplateCardPoster
                    className="template-thumb"
                    templateId={template.id as TemplateCardId}
                    width={640}
                    height={480}
                  />
                  {template.planImage ? (
                    <TemplateCardPoster
                      className="template-thumb template-thumb-plan"
                      templateId={template.id as TemplateCardId}
                      plan
                      width={640}
                      height={480}
                    />
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
