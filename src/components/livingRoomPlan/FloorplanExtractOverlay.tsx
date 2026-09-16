import type { ExtractionResult, NormalizedFloorplan } from "../../domain/floorplanExtract";

type Props = {
  draft: ExtractionResult;
  normalized: NormalizedFloorplan;
};

/** Source footprints + graph centerlines + opening intervals (pre-Apply). */
export function FloorplanExtractOverlay({ draft, normalized }: Props) {
  const nodes = normalized.graph.nodes;
  const walls = normalized.graph.edges.filter((e) => e.role !== "dropped");
  const footprints = [
    ...draft.polygons.walls.map((p) => ({ kind: "wall" as const, ring: p.outer })),
    ...draft.polygons.rooms.map((p) => ({ kind: "room" as const, ring: p.outer })),
    ...draft.polygons.doors.map((p) => ({ kind: "door" as const, ring: p.outer, id: p.id })),
    ...draft.polygons.windows.map((p) => ({ kind: "window" as const, ring: p.outer, id: p.id })),
  ];
  const pts = [
    ...nodes.map((n) => [n.x, n.y] as const),
    ...footprints.flatMap((f) => f.ring.map((p) => [p[0], p[1]] as const)),
  ];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
  const pad = Math.max(0.2, (maxX - minX) * 0.05, (maxY - minY) * 0.05);
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  const w = maxX - minX || 1;
  const dimY = minY - pad * 0.55;

  return (
    <svg
      className="lr-floorplan-extract-overlay"
      viewBox={vb}
      data-testid="lr-floorplan-extract-overlay"
      aria-label="Extracted geometry overlay"
    >
      {footprints.map((f, i) => (
        <polygon
          key={`${f.kind}-${i}`}
          points={f.ring.map((p) => `${p[0]},${p[1]}`).join(" ")}
          fill={f.kind === "room" ? "rgba(26,115,232,0.08)" : f.kind === "wall" ? "rgba(0,0,0,0.06)" : "rgba(255,152,0,0.25)"}
          stroke={f.kind === "door" || f.kind === "window" ? "#e65100" : "#90a4ae"}
          strokeWidth={0.03}
        />
      ))}
      {walls.map((e) => {
        const a = nodes[e.a], b = nodes[e.b];
        return (
          <line
            key={e.id}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={e.diagonalCollapsed ? "#b00020" : "#1a73e8"}
            strokeWidth={Math.max(e.thickM, 0.04)}
            strokeLinecap="square"
          />
        );
      })}
      {Object.entries(normalized.openingAttachments).map(([id, att]) => {
        if (att.status !== "matched") return null;
        const edge = walls.find((e) => e.sourceId === att.wallSourceId);
        if (!edge) return null;
        const a = nodes[edge.a], b = nodes[edge.b];
        const horizontal = Math.abs(a.y - b.y) < Math.abs(a.x - b.x);
        const w0 = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
        const t0 = w0 + att.offsetM;
        const t1 = t0 + att.widthM;
        const x1 = horizontal ? t0 : (a.x + b.x) * 0.5;
        const y1 = horizontal ? (a.y + b.y) * 0.5 : t0;
        const x2 = horizontal ? t1 : x1;
        const y2 = horizontal ? y1 : t1;
        return (
          <g key={id}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={att.trimmed ? "#c62828" : "#2e7d32"}
              strokeWidth={0.08}
              data-testid={`lr-floorplan-opening-${id}`}
            />
            {att.trimmed ? (
              <title>{`${id} trimmed to host wall (before Apply)`}</title>
            ) : (
              <title>{id}</title>
            )}
          </g>
        );
      })}
      <line x1={minX} y1={dimY} x2={maxX} y2={dimY} stroke="#546e7a" strokeWidth={0.02} />
      <text x={(minX + maxX) / 2} y={dimY - pad * 0.15} fontSize={pad * 0.45} textAnchor="middle" fill="#37474f">
        {`${w.toFixed(2)} m`}
      </text>
    </svg>
  );
}
