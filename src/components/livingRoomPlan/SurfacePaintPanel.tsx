import { useMemo, useState } from "react";
import type { FinishUvRebind } from "../../domain/catalog/finishRebind";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import {
  commonMaterialSlots,
  editableCommonMaterialSlots,
  isSelectionSlotEditable,
  materialsCompatibleWithSelectionSlot,
  surfacePaintCurrentFinishLabel,
  surfacePaintScopeLabel,
  type FinishImportDraft,
} from "../../domain/livingRoom";
import { effectiveSurfacePaintTarget, surfacePaintActiveMaterialId } from "../../domain/livingRoom/surfacePaintTarget";
import { useFinishImportDraft } from "../../hooks/useFinishImportDraft";
import { FinishImportExtras } from "./FinishImportExtras";
import { MaterialPreviewTile } from "./MaterialPreviewTile";
import { MaterialColourPanel } from "./MaterialColourPanel";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";
import {
  surfacePaintColourRebinds,
  surfacePaintImportApply,
  type SurfacePaintImportApply,
} from "./surfacePaintApply";

export type { SurfacePaintImportApply };

type Props = {
  project: InteriorProject;
  activeWallId: string | null;
  selectedObjects: InteriorObjectEntity[];
  onFloor: (materialId: string) => void;
  onCeiling: (materialId: string) => void;
  onWall: (wallId: string, materialId: string) => void;
  onApplyToSelection: (materialId: string, slotName?: string) => void;
  onApplyColour: (materialId: string, color: string, rebinds: FinishUvRebind[]) => void;
  onImportFinish?: (draft: FinishImportDraft, apply?: SurfacePaintImportApply) => void;
};

type PaintTarget = "floor" | "ceiling" | "wall" | "selection";

export function SurfacePaintPanel({
  project, activeWallId, selectedObjects, onFloor, onCeiling, onWall, onApplyToSelection,
  onApplyColour, onImportFinish,
}: Props) {
  const wall = project.walls.find((item) => item.id === activeWallId) ?? project.walls[0] ?? null;
  const [requestedTarget, setTarget] = useState<PaintTarget>(selectedObjects.length ? "selection" : "floor");
  const [slot, setSlot] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { draft, importError, urlBusy, stageImport, stageImportUrl, stageCatalogue, patchDraft, clear } =
    useFinishImportDraft();
  const sharedSlots = useMemo(() => commonMaterialSlots(selectedObjects), [selectedObjects]);
  const editableSlots = useMemo(() => editableCommonMaterialSlots(selectedObjects), [selectedObjects]);
  const activeSlot = editableSlots.includes(slot) ? slot : editableSlots[0] ?? "";
  const canPaintSelection = selectedObjects.length > 0 && editableSlots.length > 0;
  const target = effectiveSurfacePaintTarget(requestedTarget, canPaintSelection);
  const selectionMaterials = useMemo(() => {
    if (target !== "selection" || !activeSlot) return project.materials;
    const compatible = materialsCompatibleWithSelectionSlot(project.materials, selectedObjects, activeSlot);
    const activeId = selectedObjects[0]?.materialSlots[activeSlot];
    if (!activeId || compatible.some((material) => material.id === activeId)) return compatible;
    const current = project.materials.find((material) => material.id === activeId);
    return current ? [...compatible, current] : compatible;
  }, [target, activeSlot, project.materials, selectedObjects]);

  const activeMaterialId = surfacePaintActiveMaterialId({
    project, target, wallId: wall?.id ?? null, selectedObjects, slotName: activeSlot,
  });
  const activeMaterial = project.materials.find((material) => material.id === activeMaterialId) ?? null;
  const previewMaterial = project.materials.find((material) => material.id === previewId) ?? null;

  function apply(materialId: string) {
    if (target === "floor") onFloor(materialId);
    if (target === "ceiling") onCeiling(materialId);
    if (target === "wall" && wall) onWall(wall.id, materialId);
    if (target === "selection" && canPaintSelection) onApplyToSelection(materialId, activeSlot || undefined);
  }

  return (
    <section className="lr-surface-painter" aria-label="Surface paint">
      <div className="lr-paint-apply-summary" data-testid="paint-apply-summary">
        <strong>Current finish</strong>
        <span>{surfacePaintCurrentFinishLabel({
          finishName: activeMaterial?.name,
          materialId: activeMaterialId,
        })}</span>
        <strong>Applying to</strong>
        <span>{surfacePaintScopeLabel({
          target,
          wallSide: wall ? String(wall.extensions?.wallSide ?? "") : null,
          selectionCount: selectedObjects.length,
          slotName: target === "selection" ? activeSlot : target,
        })}</span>
        {draft ? (
          <>
            <strong>Previewing</strong>
            <span data-testid="paint-preview-finish">{draft.fileName} — not applied</span>
          </>
        ) : null}
      </div>
      <div className="lr-paint-targets" role="tablist" aria-label="Paint target">
        <button type="button" role="tab" className={target === "floor" ? "is-active" : ""} onClick={() => setTarget("floor")}>Floor</button>
        <button type="button" role="tab" className={target === "ceiling" ? "is-active" : ""} onClick={() => setTarget("ceiling")}>Ceiling</button>
        <button type="button" role="tab" disabled={!wall} className={target === "wall" ? "is-active" : ""} onClick={() => setTarget("wall")}>Wall</button>
        <button type="button" role="tab" disabled={!canPaintSelection} className={target === "selection" ? "is-active" : ""}
          onClick={() => setTarget("selection")}>Selection{selectedObjects.length > 1 ? ` (${selectedObjects.length})` : ""}</button>
      </div>
      {target === "wall" && wall ? <small>Painting {String(wall.extensions?.wallSide ?? "active wall")}</small> : null}
      {target === "selection" && sharedSlots.length > 0 ? (
        <label className="lr-select-field"><span>Slot on {selectedObjects.length} selected</span>
          <select value={activeSlot || sharedSlots[0] || ""} onChange={(event) => setSlot(event.target.value)}
            aria-label="Selection material slot" disabled={editableSlots.length === 0}>
            {sharedSlots.map((name) => {
              const locked = !isSelectionSlotEditable(selectedObjects, name);
              return <option key={name} value={name} disabled={locked}>{locked ? `${name} (locked)` : name}</option>;
            })}
          </select>
        </label>
      ) : null}
      {requestedTarget === "selection" && selectedObjects.length > 0 && !canPaintSelection ? (
        <p className="lr-inspector-hint" data-testid="paint-selection-unavailable">
          {sharedSlots.length > 0 ? "Shared slots on this selection are locked by the catalog." : "The selection has no shared paintable slot."}
          {" "}Painting the floor; cabinet finishes are under Construction.
        </p>
      ) : null}
      {(
        <>
          <MaterialPreviewTile
            project={project}
            materialId={previewId ?? activeMaterialId}
            label={previewMaterial ? `Previewing ${previewMaterial.name}` : activeMaterial ? `Applied · ${activeMaterial.name}` : "No finish applied"}
          />
          <MaterialSwatchGrid
            materials={target === "selection" ? selectionMaterials : project.materials}
            activeMaterialId={activeMaterialId ?? null}
            onPick={apply}
            onPreview={setPreviewId}
            onImport={onImportFinish ? stageImport : undefined}
            importDisabled={urlBusy}
          />
          {onImportFinish ? (
            <FinishImportExtras
              applyLabel={target === "ceiling" ? "Apply to ceiling" : target === "wall" ? "Apply to wall" : target === "selection" ? "Apply to selection" : "Apply to floor"}
              draft={draft}
              importError={importError}
              urlBusy={urlBusy}
              selectedObjects={selectedObjects}
              slotName={activeSlot}
              filterCatalogueForSelection={target === "selection"}
              onStageUrl={stageImportUrl}
              onStageCatalogue={stageCatalogue}
              onChangeDraft={patchDraft}
              onApply={() => {
                if (!draft) return;
                onImportFinish(draft, surfacePaintImportApply({
                  target, wall, selectedObjects, activeSlot, canPaintSelection,
                }));
                clear();
              }}
              onCancel={clear}
            />
          ) : null}
          <MaterialColourPanel
            project={project}
            material={activeMaterial}
            onApplyColour={(color) => {
              if (!activeMaterialId) return;
              onApplyColour(activeMaterialId, color, surfacePaintColourRebinds({
                target, wall, selectedObjects, activeSlot,
              }));
            }}
          />
          <p>Swatches save the project material ID. Shades and custom colours tint via clone-on-write when shared.</p>
        </>
      )}
    </section>
  );
}
