import type { InteriorObjectEntity, Size3Mm } from "../../domain/interiorProject";

export function PlanObjectSymbol({ object, dimensions }: { object: InteriorObjectEntity; dimensions: Size3Mm }) {
  const w = dimensions.widthMm;
  const d = dimensions.depthMm;
  if (object.category === "sofa") {
    const seats = Math.max(2, Number(object.parameters.seats) || 3);
    return (
      <g className="lr-plan-symbol">
        <rect x={-w * 0.43} y={-d * 0.34} width={w * 0.86} height={d * 0.58} rx="35" />
        <rect x={-w * 0.48} y={-d * 0.42} width={w * 0.08} height={d * 0.76} rx="25" />
        <rect x={w * 0.4} y={-d * 0.42} width={w * 0.08} height={d * 0.76} rx="25" />
        <line x1={-w * 0.4} y1={d * 0.24} x2={w * 0.4} y2={d * 0.24} />
        {Array.from({ length: seats - 1 }, (_, index) => (
          <line key={index} x1={-w * 0.4 + w * 0.8 * (index + 1) / seats} y1={-d * 0.3} x2={-w * 0.4 + w * 0.8 * (index + 1) / seats} y2={d * 0.22} />
        ))}
      </g>
    );
  }
  if (object.category === "chair" || object.category === "seat") {
    return <g className="lr-plan-symbol"><rect x={-w * 0.34} y={-d * 0.32} width={w * 0.68} height={d * 0.56} rx="55" /><path d={`M ${-w * 0.42} ${d * 0.28} Q 0 ${d * 0.43} ${w * 0.42} ${d * 0.28}`} /></g>;
  }
  if (object.category === "table") {
    return object.parameters.topShape === "round"
      ? <g className="lr-plan-symbol"><ellipse cx="0" cy="0" rx={w * 0.43} ry={d * 0.43} /><circle cx="0" cy="0" r={Math.min(w, d) * 0.08} /></g>
      : <g className="lr-plan-symbol"><rect x={-w * 0.43} y={-d * 0.4} width={w * 0.86} height={d * 0.8} rx="24" /><line x1={-w * 0.35} y1={-d * 0.3} x2={w * 0.35} y2={d * 0.3} /></g>;
  }
  if (object.category === "rug") return <rect className="lr-plan-symbol lr-rug-symbol" x={-w * 0.46} y={-d * 0.44} width={w * 0.92} height={d * 0.88} rx="55" />;
  if (object.category === "floor-lamp") return <g className="lr-plan-symbol"><circle cx="0" cy="0" r={Math.min(w, d) * 0.34} /><circle cx="0" cy="0" r={Math.min(w, d) * 0.12} /><line x1="0" y1="0" x2={w * 0.28} y2={-d * 0.28} /></g>;
  if (object.category === "plant") return <g className="lr-plan-symbol lr-plant-symbol"><circle cx="0" cy="0" r={Math.min(w, d) * 0.2} /><ellipse cx={-w * 0.18} cy={-d * 0.1} rx={w * 0.24} ry={d * 0.12} /><ellipse cx={w * 0.18} cy={d * 0.08} rx={w * 0.24} ry={d * 0.12} transform="rotate(55)" /></g>;
  if (object.category === "structural-column") return object.parameters.profile === "round"
    ? <g className="lr-plan-symbol lr-column-symbol"><circle cx="0" cy="0" r={Math.min(w, d) * 0.42} /><line x1={-w * 0.25} y1="0" x2={w * 0.25} y2="0" /><line x1="0" y1={-d * 0.25} x2="0" y2={d * 0.25} /></g>
    : <g className="lr-plan-symbol lr-column-symbol"><rect x={-w * 0.4} y={-d * 0.4} width={w * 0.8} height={d * 0.8} /><line x1={-w * 0.3} y1={-d * 0.3} x2={w * 0.3} y2={d * 0.3} /><line x1={w * 0.3} y1={-d * 0.3} x2={-w * 0.3} y2={d * 0.3} /></g>;
  if (object.category === "storage" || object.category === "media-unit") return <g className="lr-plan-symbol"><rect x={-w * 0.46} y={-d * 0.38} width={w * 0.92} height={d * 0.76} /><line x1={-w * 0.15} y1={-d * 0.38} x2={-w * 0.15} y2={d * 0.38} /><line x1={w * 0.15} y1={-d * 0.38} x2={w * 0.15} y2={d * 0.38} /></g>;
  if (object.category === "mirror") return <g className="lr-plan-symbol"><line x1={-w * 0.45} y1="0" x2={w * 0.45} y2="0" /><line x1={-w * 0.35} y1={-d * 0.35} x2={-w * 0.25} y2={d * 0.35} /><line x1="0" y1={-d * 0.35} x2={w * 0.1} y2={d * 0.35} /></g>;
  return null;
}
