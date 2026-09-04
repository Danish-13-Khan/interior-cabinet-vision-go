import { useState } from 'react'
import { AppTopbar } from '../../components/AppTopbar'
import { templatesCalm } from '../sharedTemplates'

export function CalmAppHome() {
  const [jobName, setJobName] = useState('')

  return (
    <div className="theme-view" key="calm-app">
      <AppTopbar />
      <div className="calm-layout">
        <aside className="calm-hero">
          <p className="eyebrow">Cabinet proposal workspace</p>
          <h1>Start with the room. Finish with a buildable run.</h1>
          <p className="lead">
            Measure and draw the room, build a cabinet run, present credible 3D, price a proposal — then hand the same
            design to engineering.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="jobname">
              Job name
            </label>
            <input
              className="form-input"
              id="jobname"
              type="text"
              placeholder="New cabinet job"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              style={{ borderColor: 'var(--border-mint)' }}
            />
          </div>
          <div className="calm-hero-actions">
            <button type="button" className="btn btn-primary">
              New cabinet job
            </button>
            <button type="button" className="btn btn-secondary">
              Open
            </button>
          </div>
          <p className="form-hint">Name the job, then open a blank canvas and draw the room.</p>
        </aside>

        <main className="calm-content">
          <div className="autosave-bar">
            <div>
              <div className="as-label">Autosave available</div>
              <div className="as-name">L Kitchen</div>
            </div>
            <div className="autosave-actions">
              <button type="button" className="btn btn-primary btn-sm">
                Restore
              </button>
              <button type="button" className="btn btn-secondary btn-sm">
                Discard
              </button>
            </div>
          </div>

          <section className="content-block">
            <div className="content-block-header">
              <h2>Recent work</h2>
              <span>Continue a project.</span>
            </div>
            <div className="recent-list">
              <article className="recent-card">
                <div className="recent-thumb">
                  <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="56" fill="#161616" />
                    <rect x="8" y="8" width="64" height="40" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                    <rect x="8" y="8" width="10" height="40" fill="#3d5a42" stroke="#7dba8a" strokeWidth="0.8" />
                    <rect x="8" y="38" width="64" height="10" fill="#3d5a42" stroke="#7dba8a" strokeWidth="0.8" />
                    <rect x="28" y="20" width="24" height="14" fill="#2a3a2e" stroke="#7dba8a" strokeWidth="0.8" />
                  </svg>
                </div>
                <div className="recent-info">
                  <h3>Phase 1 — Daylight Sofa</h3>
                  <p>Living Room · Rev A</p>
                </div>
                <div className="recent-meta">
                  <span className="pill">Room</span>
                  <span className="time">Edited 23 days ago</span>
                </div>
              </article>
              <article className="recent-card">
                <div className="recent-thumb">
                  <svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="56" fill="#161616" />
                    <rect x="10" y="10" width="60" height="36" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                    <rect x="10" y="10" width="60" height="8" fill="#3d5a42" stroke="#7dba8a" strokeWidth="0.8" />
                    <rect x="10" y="38" width="60" height="8" fill="#3d5a42" stroke="#7dba8a" strokeWidth="0.8" />
                  </svg>
                </div>
                <div className="recent-info">
                  <h3>L Kitchen remodel</h3>
                  <p>Kitchen · Rev B</p>
                </div>
                <div className="recent-meta">
                  <span className="pill pill-mint">Quoted</span>
                  <span className="time">Edited 2 days ago</span>
                </div>
              </article>
            </div>
          </section>

          <section className="content-block">
            <div className="content-block-header">
              <h2>Popular templates</h2>
              <span>Start from a shell or furnished room — editable in 2D and 3D.</span>
            </div>
            <div className="calm-templates">
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
        </main>
      </div>
    </div>
  )
}
