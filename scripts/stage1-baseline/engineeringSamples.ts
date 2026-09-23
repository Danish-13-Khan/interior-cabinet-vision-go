import { getDefaultCabinetConfig, type CabinetProject } from "../../src/domain/cabinetDimensions";
import {
  createCabinetConstruction,
  getConstructionFlatParts,
} from "../../src/domain/cabinetConstruction";
import { exportProjectMachineFile } from "../../src/domain/machineExport";
import {
  createProjectProductionCutlist,
  csvFromProductionCutlist,
} from "../../src/domain/productionCutlist";
import { createDefaultProjectRoom } from "../../src/domain/projectRooms";
import { DEFAULT_ROOM } from "../../src/domain/roomModel";
import { buildSceneTree, flattenSceneTree } from "../../src/domain/sceneTree";
import type { MachineJobDocument } from "../../src/domain/machineExport";
import { writeJson, writeText } from "./output";

/** Default base + drawer on the back wall. Same inputs every run. */
export function engineeringProject(): CabinetProject {
  return {
    version: 1,
    cabinets: [
      {
        id: "cab-base",
        name: "Base Cabinet",
        placement: { x: -900, y: 0, z: -1700, rotation: 0, attachment: "back-wall" },
        config: getDefaultCabinetConfig("base"),
        layerId: "layer-default",
      },
      {
        id: "cab-drawer",
        name: "Drawer Cabinet",
        placement: { x: 0, y: 0, z: -1700, rotation: 0, attachment: "back-wall" },
        config: getDefaultCabinetConfig("drawer"),
        layerId: "layer-default",
      },
    ],
    preferences: { snapSizeMm: 50, showGrid: true, autoSaveToBrowser: true },
  };
}

export function writeEngineeringSamples() {
  const project = engineeringProject();
  const lines = createProjectProductionCutlist(project);
  writeText("cutlist-sample.csv", csvFromProductionCutlist(lines));

  const room = createDefaultProjectRoom(project.cabinets, DEFAULT_ROOM, "Kitchen", "room-1");
  const flat = flattenSceneTree(buildSceneTree([room]));
  const treeIds = flat.map((node) => ({
    id: node.id,
    kind: node.kind,
    label: node.label,
    cabinetId: node.cabinetId ?? null,
    openingId: node.openingId ?? null,
  }));
  writeJson("part-identity-vs-tree.json", {
    fixture: "getDefaultCabinetConfig base + drawer",
    note: "Cut-list key is cabinetId:current construction key. Scene tree kinds stop at opening. Construction keys are not claimed stable.",
    cutlistLineCount: lines.length,
    sampleCutlistIdentity: lines.slice(0, 8).map((line) => ({
      key: line.key,
      partId: line.partId,
      shopRef: line.shopRef,
      label: line.label,
      category: line.category,
      cabinetId: line.cabinetId,
      qty: line.quantity,
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      thicknessMm: line.thicknessMm,
    })),
    constructionPartIds: project.cabinets.map((cabinet) => ({
      cabinetId: cabinet.id,
      partIds: getConstructionFlatParts(createCabinetConstruction(cabinet.config)).map((part) => part.key),
    })),
    sceneTreeKinds: [...new Set(flat.map((node) => node.kind))],
    sceneTreeNodeCount: flat.length,
    sceneTreeNodes: treeIds,
    cutlistKeysPresentAsTreeNodeIds: lines
      .filter((line) => treeIds.some((node) => node.id === line.key || node.id.endsWith(`:${line.partId}`)))
      .map((line) => line.key),
  });

  const exported = exportProjectMachineFile(project, "json-preview");
  writeText("machine-export-full.json", exported.contents);
  const job = JSON.parse(exported.contents) as MachineJobDocument;
  writeJson("machine-export-summary.json", {
    source: "exportProjectMachineFile(engineering base+drawer, json-preview)",
    fullFile: "machine-export-full.json",
    schemaVersion: job.schemaVersion,
    format: job.format,
    disclaimer: job.disclaimer,
    generatedAt: job.generatedAt,
    summary: job.summary,
    partCount: job.parts.length,
    parts: job.parts.map((part) => ({
      shopRef: part.shopRef,
      partId: part.partId,
      cabinetId: part.cabinetId,
      label: part.label,
      category: part.category,
      quantity: part.quantity,
      operationCount: part.operations.length,
      operationKinds: part.operations.map((op) => op.kind),
    })),
  });
}
