import type { LightEntity } from "../../domain/interiorProject";
import {
  COB_SHADES, COB_SHADE_LABELS, TRIM_FINISHES, TRIM_FINISH_LABELS, readCobShade,
} from "../../domain/livingRoom/lightShade";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { LightNumberField } from "./LightNumberField";

/** COB / downlight only: shade body, trim finish, lens diffusion, and the gimbal's aim. */
export function LightShadeSection(props: { light: LightEntity; actions: LightFixtureActions }) {
  const { light, actions } = props;
  const spec = readCobShade(light);
  const set = (key: string, value: number | string) => actions.updateLight(light.id, { parameters: { [key]: value } });
  return (
    <>
      <label className="lr-render-field"><span>Shade</span>
        <select aria-label={`Shade for ${light.name}`} value={spec.shade} onChange={(event) => set("shade", event.target.value)}>
          {COB_SHADES.map((shade) => <option key={shade} value={shade}>{COB_SHADE_LABELS[shade]}</option>)}
        </select>
      </label>
      <label className="lr-render-field"><span>Trim</span>
        <select aria-label={`Trim for ${light.name}`} value={spec.trimFinish} onChange={(event) => set("trimFinish", event.target.value)}>
          {TRIM_FINISHES.map((finish) => <option key={finish} value={finish}>{TRIM_FINISH_LABELS[finish]}</option>)}
        </select>
      </label>
      <LightNumberField label="Lens diffusion (0–1)" value={spec.lensDiffusion} min={0} max={1} step={0.05}
        onChange={(value) => set("lensDiffusion", value)} />
      {spec.shade === "gimbal" ? (
        <>
          <LightNumberField label="Aim (°)" value={spec.aimAngleDeg} min={0} max={45} step={1}
            onChange={(value) => set("aimAngleDeg", value)} />
          <LightNumberField label="Aim rotation (°)" value={spec.aimRotationDeg} min={0} max={359} step={5}
            onChange={(value) => set("aimRotationDeg", value)} />
        </>
      ) : null}
    </>
  );
}
