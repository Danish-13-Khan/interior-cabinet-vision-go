import type { PointerEvent } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { planLightGlyph, planLightsForRoom } from "./planLightGlyph";
import "./PlanLightsLayer.css";

export function PlanLightsLayer(props: {
  project: InteriorProject;
  activeLightId: string | null;
  hidden: boolean;
  /** Glyphs that let the pointer through to the ceiling cutout beneath them (the cutout selects and drags them). */
  passThroughLightIds?: ReadonlySet<string>;
  onSelectLight: (lightId: string) => void;
}) {
  if (props.hidden) return null;
  return (
    <g className="lr-plan-lights" data-testid="plan-lights-layer">
      {planLightsForRoom(props.project).map((light) => {
        const glyph = planLightGlyph(light);
        const selected = light.id === props.activeLightId;
        const passThrough = props.passThroughLightIds?.has(light.id) ?? false;
        const className = `lr-plan-light${selected ? " is-selected" : ""}${glyph.shape === "circle" ? " is-circle" : ""}${glyph.shape === "rect" ? " is-rect" : ""}${passThrough ? " is-hosted" : ""}`;
        const pick = (event: PointerEvent) => {
          event.stopPropagation();
          props.onSelectLight(light.id);
        };
        if (glyph.shape === "line") {
          return (
            <line key={light.id} className={className} data-light-id={light.id} pointerEvents={passThrough ? "none" : undefined}
              x1={glyph.x1} y1={glyph.z1} x2={glyph.x2} y2={glyph.z2} onPointerDown={pick} />
          );
        }
        if (glyph.shape === "rect") {
          return (
            <polygon key={light.id} className={className} data-light-id={light.id} pointerEvents={passThrough ? "none" : undefined}
              points={glyph.points} onPointerDown={pick} />
          );
        }
        return (
          <circle key={light.id} className={className} data-light-id={light.id} pointerEvents={passThrough ? "none" : undefined}
            cx={glyph.cx} cy={glyph.cz} r={glyph.r} onPointerDown={pick} />
        );
      })}
    </g>
  );
}
