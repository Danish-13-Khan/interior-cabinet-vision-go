import type { InteriorObjectEntity, Size3Mm } from "../../domain/interiorProject";
import { readCabinetIdentity } from "../../domain/cabinetIdentity";
import {
  isKitchenAppliancePlanObject,
  planObjectFootprintKind,
} from "../../domain/livingRoom/planObjectFootprint";
import { isCabinetRunFiller } from "../../domain/livingRoom/wardrobePlacement";

type ApplianceGlyphKind = "fridge" | "stove" | "hood" | "microwave" | "other";

function applianceGlyphKind(object: InteriorObjectEntity): ApplianceGlyphKind {
  const id = (object.catalogItemId ?? "").toLowerCase();
  if (id.includes("fridge")) return "fridge";
  if (id.includes("stove") || id.includes("oven")) return "stove";
  if (id.includes("hood")) return "hood";
  if (id.includes("microwave")) return "microwave";
  return "other";
}

function ApplianceSymbol({ object, dimensions }: { object: InteriorObjectEntity; dimensions: Size3Mm }) {
  const w = dimensions.widthMm;
  const d = dimensions.depthMm;
  const kind = applianceGlyphKind(object);
  if (kind === "fridge") {
    return (
      <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="fridge">
        <rect x={-w / 2} y={-d / 2} width={w} height={d} />
        <line x1={0} y1={-d / 2} x2={0} y2={d / 2} />
        <rect x={w * 0.28} y={-d * 0.12} width={w * 0.08} height={d * 0.28} rx={Math.min(w, d) * 0.02} />
      </g>
    );
  }
  if (kind === "stove") {
    const r = Math.min(w, d) * 0.1;
    return (
      <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="stove">
        <rect x={-w / 2} y={-d / 2} width={w} height={d} />
        <circle cx={-w * 0.22} cy={-d * 0.18} r={r} />
        <circle cx={w * 0.22} cy={-d * 0.18} r={r} />
        <circle cx={-w * 0.22} cy={d * 0.18} r={r} />
        <circle cx={w * 0.22} cy={d * 0.18} r={r} />
      </g>
    );
  }
  if (kind === "hood") {
    return (
      <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="hood">
        <path d={`M ${-w * 0.48} ${d * 0.15} L ${-w * 0.28} ${-d * 0.35} L ${w * 0.28} ${-d * 0.35} L ${w * 0.48} ${d * 0.15} Z`} />
        <rect x={-w * 0.12} y={-d * 0.5} width={w * 0.24} height={d * 0.18} />
      </g>
    );
  }
  if (kind === "microwave") {
    return (
      <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="microwave">
        <rect x={-w / 2} y={-d / 2} width={w} height={d} />
        <rect x={-w * 0.36} y={-d * 0.28} width={w * 0.52} height={d * 0.56} />
        <circle cx={w * 0.32} cy={0} r={Math.min(w, d) * 0.06} />
      </g>
    );
  }
  // Sink / default appliance
  if (readCabinetIdentity(object)?.cabinetType === "sink" || (object.catalogItemId ?? "").toLowerCase().includes("sink")) {
    return (
      <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="other">
        <rect x={-w / 2} y={-d / 2} width={w} height={d} />
        <ellipse cx="0" cy="0" rx={w * 0.28} ry={d * 0.22} />
        <circle cx={w * 0.12} cy={-d * 0.08} r={Math.min(w, d) * 0.06} />
      </g>
    );
  }
  return (
    <g className="lr-plan-symbol lr-cabinet-appliance-symbol" data-testid="lr-appliance-symbol" data-appliance-kind="other">
      <rect x={-w / 2} y={-d / 2} width={w} height={d} />
      <text className="lr-cabinet-mark" y="12">A</text>
    </g>
  );
}

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

  // Real appliances (fridge/stove/hood/etc.) and sink cabinets — before storage branch.
  if (isKitchenAppliancePlanObject(object) || planObjectFootprintKind(object) === "appliance") {
    return <ApplianceSymbol object={object} dimensions={dimensions} />;
  }

  if (object.category === "storage" || object.category === "media-unit") {
    const identity = readCabinetIdentity(object);
    const type = isCabinetRunFiller(object) ? "filler" : identity?.cabinetType;
    if (type === "wall") {
      return (
        <g className="lr-plan-symbol lr-cabinet-wall-symbol" data-testid="lr-cabinet-wall-symbol">
          <rect x={-w / 2} y={-d / 2} width={w} height={d} />
          <line x1={-w / 2} y1={-d * 0.15} x2={w / 2} y2={-d * 0.15} />
          <line x1={-w / 2} y1={d * 0.15} x2={w / 2} y2={d * 0.15} />
          <text className="lr-cabinet-mark" y="12">W</text>
        </g>
      );
    }
    if (type === "tall") {
      return (
        <g className="lr-plan-symbol lr-cabinet-tall-symbol" data-testid="lr-cabinet-tall-symbol">
          <rect x={-w / 2} y={-d / 2} width={w} height={d} />
          <path d={`M ${-w / 2} ${-d / 2} L ${w / 2} ${d / 2} M ${w / 2} ${-d / 2} L ${-w / 2} ${d / 2}`} />
          <text className="lr-cabinet-mark" y="12">T</text>
        </g>
      );
    }
    if (type === "base" || type === "drawer") {
      return (
        <g className="lr-plan-symbol lr-cabinet-base-symbol" data-testid="lr-cabinet-base-symbol">
          <rect x={-w / 2} y={-d / 2} width={w} height={d} />
          <line className="lr-cabinet-counter-edge" x1={-w / 2} y1={-d / 2} x2={w / 2} y2={-d / 2} />
        </g>
      );
    }
    return <g className="lr-plan-symbol"><rect x={-w * 0.46} y={-d * 0.38} width={w * 0.92} height={d * 0.76} /><line x1={-w * 0.15} y1={-d * 0.38} x2={-w * 0.15} y2={d * 0.38} /><line x1={w * 0.15} y1={-d * 0.38} x2={w * 0.15} y2={d * 0.38} /></g>;
  }
  if (object.category === "mirror") return <g className="lr-plan-symbol"><line x1={-w * 0.45} y1="0" x2={w * 0.45} y2="0" /><line x1={-w * 0.35} y1={-d * 0.35} x2={-w * 0.25} y2={d * 0.35} /><line x1="0" y1={-d * 0.35} x2={w * 0.1} y2={d * 0.35} /></g>;
  if (object.category === "wardrobe") return <g className="lr-plan-symbol lr-cabinet-tall-symbol"><rect x={-w * 0.46} y={-d * 0.38} width={w * 0.92} height={d * 0.76} /><line x1={-w * 0.3} y1={-d * 0.38} x2={-w * 0.3} y2={d * 0.38} /><line x1="0" y1={-d * 0.38} x2="0" y2={d * 0.38} /><line x1={w * 0.3} y1={-d * 0.38} x2={w * 0.3} y2={d * 0.38} /></g>;
  if (object.category === "corner-wardrobe") return <g className="lr-plan-symbol lr-corner-symbol"><path d={`M ${-w * 0.05} ${-d * 0.05} L ${w * 0.45} ${-d * 0.05} L ${w * 0.45} ${d * 0.45} L ${-d * 0.05} ${d * 0.45} Z`} /><line x1={-w * 0.05} y1={-d * 0.05} x2={w * 0.45} y2={d * 0.45} /></g>;
  if (object.category === "filler" || isCabinetRunFiller(object)) {
    return <g className="lr-plan-symbol lr-filler-symbol" data-testid="lr-filler-symbol"><rect x={-w / 2} y={-d * 0.35} width={w} height={d * 0.7} /><line x1={-w / 2} y1={-d * 0.2} x2={w / 2} y2={d * 0.2} /><line x1={-w / 2} y1={d * 0.2} x2={w / 2} y2={-d * 0.2} /></g>;
  }
  return null;
}
