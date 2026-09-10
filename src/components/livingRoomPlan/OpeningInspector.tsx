import {
  STANDARD_DOOR_HEIGHTS_MM,
  STANDARD_SILL_HEIGHTS_MM,
  STANDARD_WINDOW_HEIGHTS_MM,
  type InteriorProject,
  type OpeningEntity,
  type Point3Mm,
  type WallEntity,
} from "../../domain/interiorProject";
import { getOpeningCatalogItem, openingOffsetAtPoint } from "../../domain/livingRoom";
import { HeightPresetRow } from "./HeightPresetRow";
import { NumberField } from "./NumberField";
import { MaterialSlotList } from "./MaterialSlotList";

type OpeningPatch = Partial<Pick<OpeningEntity, "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots" | "parameters">>;

function openingPosition(opening: OpeningEntity, wall: WallEntity | null): Point3Mm {
  if (!wall) return { x: 0, y: opening.sillHeightMm, z: 0 };
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const center = opening.offsetMm + opening.widthMm / 2;
  return {
    x: wall.start.x + dx / length * center,
    y: opening.sillHeightMm,
    z: wall.start.z + dz / length * center,
  };
}

function OpeningPreview({ opening }: { opening: OpeningEntity }) {
  const item = getOpeningCatalogItem(opening.catalogItemId);
  return <div className="lr-opening-inspector-preview">
    <svg viewBox="0 0 160 100" aria-label={`${item.name} preview`}>
      <path d="M18 82H142" className="wall" />
      {item.symbol === "single-swing" ? <><path d="M38 82V25H98" /><path d="M38 82A60 60 0 0 1 98 22" className="swing" /></> : null}
      {item.symbol === "double-swing" ? <><path d="M24 82V34H80M136 82V34H80" /><path d="M24 82A56 56 0 0 1 80 26M136 82A56 56 0 0 0 80 26" className="swing" /></> : null}
      {item.symbol === "sliding" ? <><rect x="30" y="22" width="100" height="60" /><path d="M80 22V82M45 52H115M104 42L115 52L104 62" className="glass" /></> : null}
      {item.symbol === "pocket" ? <><path d="M38 82V22H98" /><path d="M38 82H130" className="swing" /><path d="M118 32V72" className="glass" /></> : null}
      {item.symbol === "fixed-glass" ? <><rect x="35" y="20" width="90" height="62" /><path d="M80 20V82M35 51H125" className="glass" /></> : null}
      {item.symbol === "casement" ? <><rect x="40" y="18" width="80" height="64" /><path d="M40 18L98 10V82L40 82" className="swing" /><path d="M40 50H120" className="glass" /></> : null}
      {item.symbol === "awning" ? <><rect x="32" y="38" width="96" height="44" /><path d="M32 38H128L116 20H44Z" className="swing" /><path d="M32 60H128" className="glass" /></> : null}
      {item.symbol === "picture-window" ? <><rect x="25" y="18" width="110" height="64" /><path d="M25 50H135" className="glass" /></> : null}
    </svg>
    <strong>{item.name}</strong><small>{item.catalogItemId}</small>
  </div>;
}

export function OpeningInspector({ opening, wall, positionOverride, snapSizeMm, materials, onUpdate, onDelete }: {
  opening: OpeningEntity;
  wall: WallEntity | null;
  positionOverride?: Point3Mm | null;
  snapSizeMm: number;
  materials: InteriorProject["materials"];
  onUpdate: (openingId: string, patch: OpeningPatch) => void;
  onDelete?: (openingId: string) => void;
}) {
  const item = getOpeningCatalogItem(opening.catalogItemId);
  const slots = opening.materialSlots ?? {};
  const slotMap = Object.fromEntries(item.materialSlots.map((slot) => [slot, slots[slot] ?? ""]));
  const position = positionOverride ?? openingPosition(opening, wall);
  const maxDepthMm = Math.max(20, wall?.thicknessMm ?? 200);
  const depthMm = Math.min(
    maxDepthMm,
    Math.max(20, Number(opening.parameters?.depthMm) || (opening.kind === "window" ? 34 : 42)),
  );
  function updateWithinWall(patch: OpeningPatch) {
    if (!wall || (patch.heightMm === undefined && patch.sillHeightMm === undefined)) {
      onUpdate(opening.id, patch);
      return;
    }
    const heightMm = Math.min(wall.heightMm, Math.max(300, patch.heightMm ?? opening.heightMm));
    const sillHeightMm = Math.min(
      Math.max(0, wall.heightMm - heightMm),
      Math.max(0, patch.sillHeightMm ?? opening.sillHeightMm),
    );
    onUpdate(opening.id, { ...patch, heightMm, sillHeightMm });
  }
  function patchPlanPosition(axis: "x" | "z", value: number) {
    if (!wall) return;
    const proposed = { ...position, [axis]: value };
    onUpdate(opening.id, {
      offsetMm: openingOffsetAtPoint(wall, proposed, opening.widthMm, snapSizeMm),
    });
  }
  return <section className="lr-opening-inspector">
    <h3>Selected Opening</h3>
    <OpeningPreview opening={opening} />
    <h4>Position <small>millimetres · snapped to wall</small></h4>
    <div className="lr-position-fields">
      <NumberField label="X" value={position.x} onChange={(x) => patchPlanPosition("x", x)} />
      <NumberField label="Y" value={position.y} onChange={(sillHeightMm) => updateWithinWall({ sillHeightMm })} />
      <NumberField label="Z" value={position.z} onChange={(z) => patchPlanPosition("z", z)} />
    </div>
    <h4>Size <small>millimetres</small></h4>
    <div className="lr-dimension-cards">
      <NumberField className="lr-dimension-card" label="W" value={opening.widthMm} onChange={(widthMm) => onUpdate(opening.id, { widthMm })} />
      <NumberField className="lr-dimension-card" label="H" value={opening.heightMm} onChange={(heightMm) => updateWithinWall({ heightMm })} />
      <NumberField className="lr-dimension-card" label="D" value={depthMm}
        onChange={(nextDepthMm) => onUpdate(opening.id, {
          parameters: { ...opening.parameters, depthMm: Math.min(maxDepthMm, Math.max(20, nextDepthMm)) },
        })} />
    </div>
    <p className="lr-inspector-hint">Drag the XYZ arrows in 3D to reposition this opening. Wall projection and clear-span limits remain active.</p>
    <details className="lr-inspector-section">
      <summary>Opening constraints</summary>
      <div className="lr-inspector-section-body">
        <NumberField label="Sill" value={opening.sillHeightMm}
          onChange={(sillHeightMm) => updateWithinWall({ sillHeightMm })} />
      </div>
    </details>
    {opening.kind === "door"
      ? <HeightPresetRow label="Door height" values={STANDARD_DOOR_HEIGHTS_MM} value={opening.heightMm}
        onChange={(heightMm) => updateWithinWall({ heightMm })} />
      : <>
        <HeightPresetRow label="Window height" values={STANDARD_WINDOW_HEIGHTS_MM} value={opening.heightMm}
          onChange={(heightMm) => updateWithinWall({ heightMm })} />
        <HeightPresetRow label="Sill height" values={STANDARD_SILL_HEIGHTS_MM} value={opening.sillHeightMm}
          onChange={(sillHeightMm) => updateWithinWall({ sillHeightMm })} />
      </>}
    <h4>Materials</h4>
    <MaterialSlotList slots={slotMap} materials={materials} allowEmpty
      onSet={(slotName, materialId) => onUpdate(opening.id, { materialSlots: { ...slots, [slotName]: materialId } })} />
    {onDelete ? (
      <button type="button" className="is-danger" onClick={() => onDelete(opening.id)}>Remove opening</button>
    ) : null}
  </section>;
}
