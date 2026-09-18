import type { RefObject } from "react";
import { PlanUnderlayControls } from "./PlanUnderlayControls";
import { ImportWallsControls } from "./ImportWallsControls";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import type { BuildTool } from "../../domain/livingRoom/buildToolCommands";

type Props = {
  tool: BuildTool;
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  underlayInputRef: RefObject<HTMLInputElement | null>;
  importWallsInputRef: RefObject<HTMLInputElement | null>;
  onCalibrateUnderlay?: () => void;
};

export function BuildRoomPlanFiles(props: Props) {
  return (
    <>
      <section className={`lr-room-authoring${props.tool === "upload-underlay" ? " is-tool-focus" : ""}`}>
        <strong>4. Plan underlay</strong>
        <small>
          {props.tool === "upload-underlay"
            ? "Upload tool armed — choose a PNG, JPG, or PDF to trace."
            : "Optional tracing image. Does not create walls."}
        </small>
      </section>
      <PlanUnderlayControls
        underlay={props.underlay}
        onChange={props.onSetPlanUnderlay}
        onReplace={() => props.underlayInputRef.current?.click()}
        onCalibrate={props.onCalibrateUnderlay}
      />
      <ImportWallsControls onChoose={() => props.importWallsInputRef.current?.click()} />
      {props.importError ? <p className="lr-import-error">{props.importError}</p> : null}
    </>
  );
}
