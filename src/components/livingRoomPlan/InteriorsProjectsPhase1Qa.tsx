import {
  PHASE1_BENCHMARK_DEFINITIONS,
  type Phase1BenchmarkId,
} from "../../domain/livingRoom";

/** Dev/QA entry points for locked Phase 1 presentation-floor rooms. */
export function InteriorsProjectsPhase1Qa({
  onOpen,
}: {
  onOpen: (benchmarkId: Phase1BenchmarkId) => void;
}) {
  return (
    <section className="lr-phase1-qa" aria-label="Phase 1 scorecard rooms" data-testid="interiors-phase1-qa">
      <div className="lr-home-section-title">
        <div><span>QA</span><strong>Phase 1 scorecard rooms</strong></div>
        <small>Locked cameras · Draft vs Client Preview</small>
      </div>
      <p className="lr-phase1-qa-copy">
        Open each benchmark, switch cameras A/B in Render Studio, then capture Draft and Client Preview PNGs into
        <code> tmp/phase-1-baselines/</code>.
      </p>
      <div className="lr-phase1-qa-grid">
        {PHASE1_BENCHMARK_DEFINITIONS.map((bench) => (
          <button
            key={bench.id}
            type="button"
            data-testid={`interiors-phase1-${bench.id}`}
            onClick={() => onOpen(bench.id)}
          >
            <strong>{bench.name}</strong>
            <span>{bench.intent}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
