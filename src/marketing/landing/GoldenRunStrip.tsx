import type { CSSProperties } from 'react'

const STAGES = [
  { label: 'Plan', body: 'Room measured and locked after sign-off.', icon: 'M4 20V4h16v16H4zM4 12h7v8' },
  { label: '3D', body: 'The same run, rendered in the chosen finish.', icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5' },
  { label: 'Proposal', body: 'Priced snapshot attached to the customer copy.', icon: 'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h3' },
  { label: 'Shop', body: 'Engineering opens the identical revision.', icon: 'M3 21V10l5-4 5 4 5-4 3 2v13zM8 21v-5h4v5' },
]

/** Plan → 3D → proposal → shop. Scroll-driven fill where supported; fully lit otherwise. */
export function GoldenRunStrip() {
  return (
    <section className="section" id="golden-run" aria-labelledby="golden-run-title">
      <div className="container">
        <div className="section-header section-center reveal">
          <p className="eyebrow">The golden run</p>
          <h2 id="golden-run-title">One design. Sales to shop floor.</h2>
          <p>What you sold is what gets built, because every step opens the same project revision.</p>
        </div>
        <div className="golden-strip">
          <div className="golden-strip-track" aria-hidden="true"><span className="golden-strip-fill" /></div>
          <ol className="golden-strip-steps">
            {STAGES.map((stage, index) => (
              <li className="golden-step" key={stage.label} style={{ '--i': index } as CSSProperties}>
                <span className="golden-step-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={stage.icon} /></svg>
                </span>
                <h3>{stage.label}</h3>
                <p>{stage.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
