const FEATURES = [
  { icon: 'M4 20V9l8-5 8 5v11H4z', title: 'Room-first canvas', body: 'Start from real dimensions. Walls, doors, windows and appliances come before cabinets.' },
  { icon: 'M3 20h18M5 20V10h6v10M13 20V10h6v10M5 8h14V4H5z', title: 'Buildable cabinet runs', body: 'Catalog units with fillers, panels and constraints that keep the design shop-ready.' },
  { icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5', title: 'Credible 3D', body: 'Elevations and walkthroughs that look like the finished kitchen, not a sketch.' },
  { icon: 'M4 7h16v10H4zM8 12h8M12 9v6', title: 'Live pricing', body: 'Material and catalog pricing roll up as you design, so proposals stay honest.' },
  { icon: 'M4 12h12m-4-4 4 4-4 4M20 5v14', title: 'Engineering handoff', body: 'One design file from sale to production. The shop builds what you sold.' },
  { icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', title: 'Templates library', body: 'Start from a shell or a furnished room and edit freely in 2D and 3D.' },
]

export function FeatureGrid() {
  return (
    <section className="section section-alt" id="features" aria-labelledby="features-title">
      <div className="container">
        <div className="section-header reveal">
          <p className="eyebrow">Features</p>
          <h2 id="features-title">Everything a cabinet salesperson needs</h2>
          <p>Built for proposal speed without giving up buildability.</p>
        </div>
        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li className="feature-card reveal" key={feature.title}>
              <svg className="feature-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d={feature.icon} />
              </svg>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
