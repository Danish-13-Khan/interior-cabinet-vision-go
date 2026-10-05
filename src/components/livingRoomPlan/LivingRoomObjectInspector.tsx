import type { ReactNode } from "react";
import type { InteriorObjectEntity, InteriorProject, Size3Mm } from "../../domain/interiorProject";
import { catalogSlotPoliciesForObject } from "../../domain/catalog";
import {
  isMillworkObject,
  isWallPanelObject,
  type PanelAttachment,
} from "../../domain/livingRoom";
import { NumberField } from "./NumberField";
import { DimensionPresetMenu } from "./DimensionPresetMenu";
import { CabinetConstructionSection } from "./CabinetConstructionSection";
import { CabinetRunInspector } from "./CabinetRunInspector";
import { MaterialSlotList } from "./MaterialSlotList";
import { PanelAttachmentInspector } from "./PanelAttachmentInspector";

type LivingRoomObjectInspectorProps = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  materials: InteriorProject["materials"];
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onUpdateRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
  onCompleteRun?: (runId: string) => void;
  onUpdatePanelAttachment?: (objectId: string, patch: Partial<PanelAttachment>) => void;
  onSetPanelVisible?: (objectId: string, visible: boolean) => void;
  onAddWallPanel?: (wallId: string) => void;
  /** Import a photo of a laminate, veneer or fabric onto one surface of this object. */
  onImportFinish?: (file: File, apply: { selection: { objectIds: readonly string[]; slotName: string } }) => void;
  actions?: ReactNode;
  positionEditor?: ReactNode;
  /** Finishes start open (Materials step, furniture & decor). */
  finishesOpen?: boolean;
  /** Run starts open (Run tool). */
  runOpen?: boolean;
};

/**
 * Shared Plan/Model editor — millimetres stay InteriorProject truth.
 * Order: Identity → Size → Position → Finishes → Construction → Run; only Size opens by default.
 */
export function LivingRoomObjectInspector({
  object, project, materials, onResize, onSetMaterial, onSetParameters, onUpdateRun, onCompleteRun,
  onUpdatePanelAttachment, onSetPanelVisible, onAddWallPanel, onImportFinish, actions, positionEditor,
  finishesOpen = false, runOpen = false,
}: LivingRoomObjectInspectorProps) {
  function patchDimension(axis: keyof Size3Mm, value: number) {
    onResize(object.id, { ...object.dimensions, [axis]: value });
  }
  const onSchedule = isMillworkObject(object);
  const wallPanel = isWallPanelObject(object);
  const boxCabinet = object.kind === "cabinet" && object.category !== "filler" && !wallPanel;

  return (
    <section className="lr-object-inspector">
      <div className="lr-object-identity" data-object-id={object.id}>
        <strong>{object.name}</strong>
        {onSchedule
          ? <em className="lr-millwork-badge">Millwork item</em>
          : <em className="lr-millwork-badge is-soft">Furniture &amp; decor</em>}
        <code className="lr-object-technical-identity" title="Catalogue id">{object.catalogItemId}</code>
      </div>
      {actions}
      <details className="lr-inspector-section lr-size-section" data-testid="inspector-size" open>
        <summary>Size <small>mm</small></summary>
        <div className="lr-inspector-section-body">
          <div className="lr-dimension-cards" aria-label="Object dimensions in millimetres">
            <NumberField className="lr-dimension-card" label="W" value={object.dimensions.widthMm} onChange={(value) => patchDimension("widthMm", value)} />
            <NumberField className="lr-dimension-card" label="H" value={object.dimensions.heightMm} onChange={(value) => patchDimension("heightMm", value)} />
            <NumberField className="lr-dimension-card" label="D" value={object.dimensions.depthMm} onChange={(value) => patchDimension("depthMm", value)} />
          </div>
          {object.kind === "cabinet" && !wallPanel ? (
            <DimensionPresetMenu dimensions={object.dimensions} onChange={(dimensions) => onResize(object.id, dimensions)} />
          ) : null}
        </div>
      </details>
      {positionEditor}
      {onUpdatePanelAttachment && onSetPanelVisible ? (
        <PanelAttachmentInspector
          object={object}
          project={project}
          onUpdateAttachment={onUpdatePanelAttachment}
          onSetVisible={onSetPanelVisible}
          onAddWallPanel={onAddWallPanel}
        />
      ) : null}
      <details className="lr-inspector-section lr-finishes-section" data-testid="inspector-finishes" open={finishesOpen}>
        <summary>Finishes</summary>
        <div className="lr-inspector-section-body">
          <MaterialSlotList
            slots={object.materialSlots}
            materials={materials}
            slotPolicies={catalogSlotPoliciesForObject(object)}
            onSet={(slotName, materialId) => onSetMaterial(object.id, slotName, materialId)}
            onImport={onImportFinish
              ? (slotName, file) => onImportFinish(file, { selection: { objectIds: [object.id], slotName } })
              : undefined}
          />
        </div>
      </details>
      {boxCabinet ? <CabinetConstructionSection object={object} onSetParameters={onSetParameters} /> : null}
      {boxCabinet ? (
        <CabinetRunInspector object={object} project={project} onUpdate={onUpdateRun} onCompleteRun={onCompleteRun} open={runOpen} />
      ) : null}
    </section>
  );
}
