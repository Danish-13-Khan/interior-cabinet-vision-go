import type { ReactNode } from "react";

/** Mock-aligned Layers / Export sheet menus. Same controls, opened on demand. */
export function PlanOnDemandChrome(props: { layers?: ReactNode; exportPanel?: ReactNode }) {
  return (
    <div className="lr-plan-on-demand">
      {props.layers ? (
        <details className="lr-plan-on-demand-panel" data-testid="lr-plan-layers-panel">
          <summary>Layers</summary>
          <div className="lr-plan-on-demand-body">{props.layers}</div>
        </details>
      ) : null}
      {props.exportPanel ? (
        <details className="lr-plan-on-demand-panel is-export" data-testid="lr-plan-export-panel">
          <summary>Export sheet</summary>
          <div className="lr-plan-on-demand-body">{props.exportPanel}</div>
        </details>
      ) : null}
    </div>
  );
}
