import { useMemo, useState } from 'react'
import { AppTopbar } from '../../components/AppTopbar'

type Filter = 'all' | 'design' | 'quoted' | 'engineering'

const jobs = [
  {
    name: 'Phase 1 — Daylight Sofa',
    room: 'Living Room',
    rev: 'Rev A',
    status: 'Room' as const,
    updated: 'Edited 23 days ago',
    filter: 'design' as const,
  },
  {
    name: 'L Kitchen remodel',
    room: 'Kitchen',
    rev: 'Rev B',
    status: 'Quoted' as const,
    updated: 'Edited 2 days ago',
    filter: 'quoted' as const,
  },
]

export function CompactAppHome() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [newJob, setNewJob] = useState('')
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filter === 'design' && j.filter !== 'design') return false
      if (filter === 'quoted' && j.filter !== 'quoted') return false
      if (filter === 'engineering') return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          j.name.toLowerCase().includes(q) ||
          j.room.toLowerCase().includes(q) ||
          j.status.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [filter, search])

  const counts = {
    all: jobs.length,
    design: jobs.filter((j) => j.filter === 'design').length,
    quoted: jobs.filter((j) => j.filter === 'quoted').length,
    engineering: 0,
  }

  return (
    <div className="theme-view" key="compact-app">
      <AppTopbar />
      <div className="compact-layout">
        <aside className="compact-sidebar">
          <div className="ws-label">Workspace</div>
          <nav className="ws-nav">
            {(
              [
                ['all', 'All jobs', counts.all],
                ['design', 'In design', counts.design],
                ['quoted', 'Quoted', counts.quoted],
                ['engineering', 'Engineering', counts.engineering],
              ] as const
            ).map(([id, label, count]) => (
              <a
                key={id}
                href={`#${id}`}
                className={filter === id ? 'is-active' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setFilter(id)
                }}
              >
                <span>{label}</span>
                <span className="count">{count}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="compact-main">
          <div className="compact-header">
            <div>
              <p className="eyebrow">Active jobs</p>
              <h1>Cabinet jobs</h1>
            </div>
            <div className="compact-toolbar">
              <div className="form-group">
                <label className="form-label" htmlFor="search">
                  Search jobs
                </label>
                <input
                  className="form-input"
                  id="search"
                  type="search"
                  placeholder="Project, room or status"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="newjob">
                  New job name
                </label>
                <input
                  className="form-input"
                  id="newjob"
                  type="text"
                  placeholder="New cabinet job"
                  value={newJob}
                  onChange={(e) => setNewJob(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary btn-sm">
                Import
              </button>
              <button type="button" className="btn btn-primary btn-sm">
                + New job
              </button>
            </div>
          </div>

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

          <table className="jobs-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Room</th>
                <th>Revision</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.name} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="job-name">{j.name}</div>
                    <div className="job-sub">Cabinet Studio job</div>
                  </td>
                  <td className="muted">{j.room}</td>
                  <td className="muted">{j.rev}</td>
                  <td>
                    <span className={j.status === 'Quoted' ? 'pill pill-mint' : 'pill'}>{j.status}</span>
                  </td>
                  <td className="muted">{j.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            className="expandable"
            onClick={() => setTemplatesOpen((v) => !v)}
            aria-expanded={templatesOpen}
          >
            <span className="chevron">{templatesOpen ? '▼' : '▶'}</span> Quick start templates
          </button>
          {templatesOpen && (
            <p className="form-hint" style={{ marginTop: 12, marginLeft: 8 }}>
              L-shaped, Galley, U-shaped, Vanity, Pantry, Empty shell — pick one to start a canvas.
            </p>
          )}
          <button type="button" className="expandable">
            <span className="chevron">▶</span> Developer — Phase 1 QA
          </button>
        </main>
      </div>
    </div>
  )
}
