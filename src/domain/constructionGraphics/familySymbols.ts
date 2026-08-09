import type { CabinetType } from "../cabinetDimensions";
import { circle, line, path, rect } from "./svg";

/**
 * Compact family-specific plan symbols centered in the cabinet footprint.
 */
export function renderFamilyPlanSymbol(
  type: CabinetType,
  cx: number,
  cy: number,
  bw: number,
  bd: number,
): string[] {
  const elements: string[] = [];
  const inset = Math.min(bw, bd) * 0.18;
  const left = cx - bw / 2 + inset;
  const right = cx + bw / 2 - inset;
  const top = cy - bd / 2 + inset;
  const bottom = cy + bd / 2 - inset;
  const w = Math.max(4, right - left);
  const d = Math.max(3, bottom - top);

  switch (type) {
    case "base":
      elements.push(
        line(left, bottom, right, bottom, `class="twod-family-symbol twod-cabinet-front" pointer-events="none"`),
        line(left, top, left, bottom, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
        line(right, top, right, bottom, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
        path(
          `M ${left} ${bottom} A ${w} ${w} 0 0 1 ${left + Math.min(w, d)} ${bottom - Math.min(w, d)}`,
          `class="twod-family-symbol twod-door-swing twod-line-hidden" fill="none" pointer-events="none"`,
        ),
      );
      break;
    case "wall":
      elements.push(
        rect(
          left,
          top,
          w,
          d,
          `class="twod-family-symbol twod-line-phantom" fill="none" pointer-events="none"`,
        ),
        line(left, cy, right, cy, `class="twod-family-symbol twod-line-center" pointer-events="none"`),
        line(left, top + d * 0.35, right, top + d * 0.35, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
        line(left, top + d * 0.65, right, top + d * 0.65, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
      );
      break;
    case "tall":
    case "almirah":
      elements.push(
        line(cx, top, cx, bottom, `class="twod-family-symbol twod-line-center" pointer-events="none"`),
        line(left, top + d * 0.15, left, bottom - d * 0.15, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
        line(right, top + d * 0.15, right, bottom - d * 0.15, `class="twod-family-symbol twod-line-interior" pointer-events="none"`),
        line(left, top + d * 0.4, right, top + d * 0.4, `class="twod-family-symbol twod-shelf-line" pointer-events="none"`),
        line(left, top + d * 0.7, right, top + d * 0.7, `class="twod-family-symbol twod-shelf-line" pointer-events="none"`),
      );
      break;
    case "drawer":
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        const y = top + d * t;
        elements.push(
          line(left, y, right, y, `class="twod-family-symbol twod-drawer-pull twod-line-interior" pointer-events="none"`),
        );
      }
      break;
    case "sink": {
      const rx = Math.min(w, d) * 0.42;
      elements.push(
        circle(cx, cy, rx, `class="twod-family-symbol twod-sink-bowl" fill="none" pointer-events="none"`),
        circle(cx, cy, rx * 0.22, `class="twod-family-symbol twod-sink-drain" fill="none" pointer-events="none"`),
      );
      break;
    }
    case "corner":
      elements.push(
        path(
          `M ${left} ${bottom} L ${left} ${top} L ${cx} ${top} L ${cx} ${cy} L ${right} ${cy} L ${right} ${bottom} Z`,
          `class="twod-family-symbol twod-corner-mark" fill="none" pointer-events="none"`,
        ),
      );
      break;
    case "open-shelf":
      for (const t of [0.3, 0.55, 0.8]) {
        const y = top + d * t;
        elements.push(
          line(left, y, right, y, `class="twod-family-symbol twod-shelf-line" pointer-events="none"`),
        );
      }
      break;
    case "table":
      elements.push(
        rect(left, top, w, d, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        circle(left + 2, top + 2, 1.2, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        circle(right - 2, top + 2, 1.2, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        circle(left + 2, bottom - 2, 1.2, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        circle(right - 2, bottom - 2, 1.2, `class="twod-family-symbol" fill="none" pointer-events="none"`),
      );
      break;
    case "chair":
      elements.push(
        rect(cx - w * 0.25, cy - d * 0.15, w * 0.5, d * 0.45, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        line(cx - w * 0.25, cy - d * 0.15, cx + w * 0.25, cy - d * 0.35, `class="twod-family-symbol" pointer-events="none"`),
      );
      break;
    case "sofa":
      elements.push(
        rect(left, top + d * 0.2, w, d * 0.6, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        line(cx, top + d * 0.2, cx, top + d * 0.8, `class="twod-family-symbol twod-line-reference" pointer-events="none"`),
      );
      break;
    case "mirror":
      elements.push(
        rect(left + w * 0.15, top, w * 0.7, d, `class="twod-family-symbol" fill="none" pointer-events="none"`),
        line(left + w * 0.25, top + 2, right - w * 0.25, bottom - 2, `class="twod-family-symbol twod-line-reference" pointer-events="none"`),
      );
      break;
    default:
      break;
  }

  return elements;
}

/** Phantom footprint for wall cabinets above base cabinets in plan. */
export function renderWallPhantomFootprint(
  cx: number,
  cy: number,
  bw: number,
  bd: number,
): string[] {
  return [
    rect(
      cx - bw / 2,
      cy - bd / 2,
      bw,
      bd,
      `class="twod-cabinet-phantom twod-line-phantom" fill="none" pointer-events="none"`,
    ),
  ];
}
