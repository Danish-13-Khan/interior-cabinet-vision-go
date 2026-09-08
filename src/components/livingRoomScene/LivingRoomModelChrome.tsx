import {
  getCabinetMechanismState,
  mechanismAllPatch,
  type LivingRoomStyleId,
  type ModelViewPresetId,
} from "../../domain/livingRoom";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import type { useRenderDiagnostics } from "../../hooks/useRenderDiagnostics";
import { CabinetMechanismPanel } from "./CabinetMechanismPanel";
import { ModelViewOnboarding } from "./ModelViewOnboarding";
import { ModelViewReadout } from "./ModelViewReadout";
import { ModelViewStylePalette } from "./ModelViewStylePalette";
import { RenderDiagnosticsPanel } from "./RenderDiagnosticsPanel";

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
      {props.diagnostics ? <RenderDiagnosticsPanel report={props.diagnostics} compact /> : null}
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
      <ModelViewStylePalette
        activeStyleId={props.activeStyleId}
        activeStyleName={props.activeStyleName}
        onApplyStyle={props.onApplyStyle}
      />
      <ModelViewReadout
        viewPreset={props.viewPreset}
        honestyBadge={props.honestyBadge}
        exposure={props.exposure}
        planTraceHint={props.planTraceHint}
      />
    </>
  );
}
