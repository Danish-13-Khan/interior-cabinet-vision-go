import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomStyleId, ModelViewPresetId } from "../../domain/livingRoom";
import type { useRenderDiagnostics } from "../../hooks/useRenderDiagnostics";
import { ModelReviewDock } from "./ModelReviewDock";
import { ModelViewCanvasHint } from "./ModelViewCanvasHint";
import { ModelViewOnboarding } from "./ModelViewOnboarding";

type LivingRoomModelChromeProps = {
  showGuide: boolean;
  viewPreset: ModelViewPresetId;
  onChoosePreset: (preset: ModelViewPresetId) => void;
  onDismissGuide: () => void;
  diagnostics: ReturnType<typeof useRenderDiagnostics>;
  activeObject: InteriorObjectEntity | null;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  activeStyleId: LivingRoomStyleId;
  activeStyleName: string;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  honestyBadge: string;
  exposure: number;
  planTraceHint: boolean;
  cutawayWalls: boolean;
  onCutawayWalls: (value: boolean) => void;
  project: InteriorProject;
  onPatchDocument?: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
};

export function LivingRoomModelChrome(props: LivingRoomModelChromeProps) {
  return (
    <>
      {props.showGuide ? (
        <ModelViewOnboarding
          activePreset={props.viewPreset}
          onChoosePreset={props.onChoosePreset}
          onDismiss={props.onDismissGuide}
        />
      ) : null}
      <ModelViewCanvasHint
        viewPreset={props.viewPreset}
        honestyBadge={props.honestyBadge}
        planTraceHint={props.planTraceHint}
      />
      <ModelReviewDock
        cutawayWalls={props.cutawayWalls}
        onCutawayWalls={props.onCutawayWalls}
        project={props.project}
        onPatchDocument={props.onPatchDocument}
        diagnostics={props.diagnostics}
        activeObject={props.activeObject}
        onSetParameters={props.onSetParameters}
        activeStyleId={props.activeStyleId}
        activeStyleName={props.activeStyleName}
        onApplyStyle={props.onApplyStyle}
      />
    </>
  );
}
