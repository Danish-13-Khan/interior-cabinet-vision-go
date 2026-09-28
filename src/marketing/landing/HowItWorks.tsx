import type { ReactNode } from 'react'
import { HandoffClip, MeasureClip, ProposalClip, RunClip } from './HowClips'

const STEPS: { title: string; body: string; clip: ReactNode }[] = [
  { title: 'Measure and draw', body: 'Capture walls, openings and obstacles so the plan matches the site.', clip: <MeasureClip /> },
  { title: 'Build the run', body: 'Place base, wall and tall units. Adjust widths and fillers until it fits.', clip: <RunClip /> },
  { title: 'Price and propose', body: 'Show credible 3D and a priced proposal your customer can trust.', clip: <ProposalClip /> },
  { title: 'Hand off', body: 'Engineering opens the approved run. No redraw, no lost intent.', clip: <HandoffClip /> },
]

export function HowItWorks() {
  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="container">
        <div className="section-header reveal">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">From tape measure to shop ticket</h2>
          <p>One continuous run from the first measurement to the cut list.</p>
        </div>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li className="step reveal" key={step.title}>
              <div className="step-clip">{step.clip}</div>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
