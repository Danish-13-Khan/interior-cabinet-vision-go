import { line } from "./svg";

/**
 * Dense plan carcass internals: sides, rear, and depth shelves cue.
 * Front edge is drawn separately as the heavy outline.
 */
export function renderPlanCarcassInterior(
  cx: number,
  cy: number,
  bw: number,
  bd: number,
): string[] {
  const inset = Math.min(2.2, Math.min(bw, bd) * 0.06);
  const left = cx - bw / 2 + inset;
  const right = cx + bw / 2 - inset;
  const front = cy - bd / 2 + inset;
  const rear = cy + bd / 2 - inset;
  const mid = cy + bd * 0.08;
  const elements = [
    line(
      left,
      front,
      left,
      rear,
      `class="twod-line-interior twod-carcass-side" pointer-events="none"`,
    ),
    line(
      right,
      front,
      right,
      rear,
      `class="twod-line-interior twod-carcass-side" pointer-events="none"`,
    ),
    line(
      left,
      rear,
      right,
      rear,
      `class="twod-line-interior twod-carcass-rear" pointer-events="none"`,
    ),
  ];
  if (bd > 14) {
    elements.push(
      line(
        left + 1,
        mid,
        right - 1,
        mid,
        `class="twod-line-interior twod-shelf-line" pointer-events="none"`,
      ),
    );
  }
  if (bw > 22) {
    const partition = cx;
    elements.push(
      line(
        partition,
        front + 1,
        partition,
        rear - 1,
        `class="twod-line-reference twod-carcass-partition" pointer-events="none"`,
      ),
    );
  }
  return elements;
}
