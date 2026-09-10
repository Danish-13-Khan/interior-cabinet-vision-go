import { useRef, type ReactNode } from "react";

/** Mock-aligned Layers / Export sheet menus. Same controls, opened on demand. */
export function PlanOnDemandChrome(props: { layers?: ReactNode; exportPanel?: ReactNode }) {
  const layersRef = useRef<HTMLDetailsElement>(null);
  const exportRef = useRef<HTMLDetailsElement>(null);

  function keepOneOpen(current: HTMLDetailsElement, other: HTMLDetailsElement | null) {
    if (current.open && other) other.open = false;
  }

  return (
    <div className="lr-plan-on-demand">
      {props.layers ? (
        <details ref={layersRef} onToggle={(event) => keepOneOpen(event.currentTarget, exportRef.current)} className="lr-plan-on-demand-panel" data-testid="lr-plan-layers-panel">
          <summary>Layers</summary>
          <div className="lr-plan-on-demand-body">{props.layers}</div>
        </details>
      ) : null}
      {props.exportPanel ? (
        <details ref={exportRef} onToggle={(event) => keepOneOpen(event.currentTarget, layersRef.current)} className="lr-plan-on-demand-panel is-export" data-testid="lr-plan-export-panel">
          <summary>Export sheet</summary>
          <div className="lr-plan-on-demand-body">{props.exportPanel}</div>
        </details>
      ) : null}
    </div>
  );
}
