import type { ReactNode } from "react";

/** Overview fixtures keep the mesh and omit the three.js light. */
export function FixtureEmitter({ on, children }: { on: boolean; children: ReactNode }) {
  return on ? children : null;
}
