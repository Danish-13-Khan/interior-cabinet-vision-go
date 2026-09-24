import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import {
  getCabinetMechanismState,
  mechanismAllPatch,
  type LivingRoomStyleId,
} from "../../domain/livingRoom";
import type { useRenderDiagnostics } from "../../hooks/useRenderDiagnostics";
import { CabinetMechanismPanel } from "./CabinetMechanismPanel";
import { ModelViewStylePalette } from "./ModelViewStylePalette";
import { RenderDiagnosticsPanel } from "./RenderDiagnosticsPanel";
import { RoomLightFixturesPopover } from "./RoomLightFixturesPopover";

const DOCK_SELECTOR = "[data-testid='model-review-dock']";

export function ModelReviewDock(props: {
  cutawayWalls: boolean;
  onCutawayWalls: (value: boolean) => void;
  project: InteriorProject;
  onPatchDocument?: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  diagnostics: ReturnType<typeof useRenderDiagnostics>;
  activeObject: InteriorObjectEntity | null;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  activeStyleId: LivingRoomStyleId;
  activeStyleName: string;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(document.querySelector<HTMLElement>(DOCK_SELECTOR));
  });

  const body: ReactNode = (
    <div className="model-review-dock" data-testid="model-review-dock-body">
      <section className="model-review-dock-block" aria-label="Scene controls">
        <header>Scene controls</header>
        <label className="model-review-toggle">
          <span>Wall cutaway</span>
          <input
            type="checkbox"
            role="switch"
            data-testid="model-cutaway-walls"
            checked={props.cutawayWalls}
            aria-checked={props.cutawayWalls}
            onChange={(event) => props.onCutawayWalls(event.target.checked)}
          />
        </label>
        {props.onPatchDocument ? (
          <RoomLightFixturesPopover project={props.project} onPatchDocument={props.onPatchDocument} />
        ) : null}
      </section>
      <ModelViewStylePalette
        activeStyleId={props.activeStyleId}
        activeStyleName={props.activeStyleName}
        onApplyStyle={props.onApplyStyle}
      />
      <CabinetMechanismPanel
        object={props.activeObject}
        onChange={props.onSetParameters}
        onSoftClose={(object) => {
          const state = getCabinetMechanismState(object);
          if (!state) return;
          props.onSetParameters(object.id, mechanismAllPatch(state, true));
          window.setTimeout(
            () => props.onSetParameters(object.id, mechanismAllPatch(state, false)),
            650,
          );
        }}
      />
      {props.diagnostics ? (
        <details className="lr-model-diagnostics-disclosure is-docked">
          <summary>
            Scene health
            {props.diagnostics.warnings.length > 0 ? ` · ${props.diagnostics.warnings.length}` : " · ready"}
          </summary>
          <RenderDiagnosticsPanel report={props.diagnostics} compact />
        </details>
      ) : null}
    </div>
  );

  if (!host) return null;
  return createPortal(body, host);
}
