export function Placeholder3dPane() {
  return (
    <section className="gfl-panel gfl-3d" aria-label="3D preview placeholder">
      <header className="gfl-panel__head">
        <h2>3D shell</h2>
        <p>Deterministic Three.js build arrives in Phase 3.</p>
      </header>
      <div className="gfl-3d__stage">
        <div className="gfl-3d__grid" aria-hidden />
        <p>No mesh yet — Phase 0 placeholder</p>
      </div>
    </section>
  );
}
