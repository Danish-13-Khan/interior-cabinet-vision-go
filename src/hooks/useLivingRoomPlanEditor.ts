import { useEffect, useMemo, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { cabinetProjectFromInteriorProject, type InteriorProject } from "../domain/interiorProject";
import {
  createGoldenCabinetRunProject,
  createLivingRoomReleaseDemoProject,
  createPhase1BenchmarkProject,
  inspectLivingRoomPlan,
  type LivingRoomStyleId,
  type Phase1BenchmarkId,
  type PlannerStarterTemplate,
} from "../domain/livingRoom";
import { buildLivingRoomStarterDocument } from "../domain/livingRoom/buildStarterDocument";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import { cabinetRunCommands } from "./livingRoomPlanEditor/cabinetRuns";
import {
  createCommitDocument,
  currentLivingRoomDocument,
  type EditorCommandContext,
} from "./livingRoomPlanEditor/context";
import { finishCommands } from "./livingRoomPlanEditor/finishCommands";
import { objectEditingCommands } from "./livingRoomPlanEditor/objectEditing";
import { objectPlacementCommands } from "./livingRoomPlanEditor/objectPlacement";
import { roomCommands } from "./livingRoomPlanEditor/roomCommands";
import { lightCommands } from "./livingRoomPlanEditor/lightCommands";
import { wallCommands } from "./livingRoomPlanEditor/wallCommands";

type UseLivingRoomPlanEditorArgs = {
  project: CabinetProject;
  room: RoomConfig;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  onStatus?: (status: string) => void;
};

/**
 * Interiors editor state (selection, pre-drop reason, project home) plus every document command.
 * The commands live in ./livingRoomPlanEditor/, grouped by what they edit.
 */
export function useLivingRoomPlanEditor({
  project,
  room,
  commitProjectChange,
  commitSnapshot,
  onStatus,
}: UseLivingRoomPlanEditorArgs) {
  const document = currentLivingRoomDocument(project);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [preDropReason, setPreDropReason] = useState<string | null>(null);
  const [projectHomeOpen, setProjectHomeOpen] = useState(() => !document);

  useEffect(() => {
    const validIds = new Set(document?.objects.map((object) => object.id) ?? []);
    setSelectedObjectIds((current) => current.filter((id) => validIds.has(id)));
  }, [document]);

  useEffect(() => {
    if (!document) setProjectHomeOpen(true);
  }, [document]);

  const selectedObjects = useMemo(
    () =>
      document?.objects.filter((object) => selectedObjectIds.includes(object.id)) ?? [],
    [document, selectedObjectIds],
  );
  const issues = useMemo(
    () => (document ? inspectLivingRoomPlan(document) : []),
    [document],
  );

  function openDocument(nextDocument: InteriorProject, status: string, selectedId: string | undefined) {
    const compatible = cabinetProjectFromInteriorProject(nextDocument);
    commitSnapshot(
      {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: [],
        activeCabinetId: null,
        selectedPanelName: null,
      },
      status,
    );
    setSelectedObjectIds(selectedId ? [selectedId] : []);
    setProjectHomeOpen(false);
  }

  function createStarter(options: {
    projectName?: string;
    styleId?: LivingRoomStyleId;
    template?: PlannerStarterTemplate;
    catalogTemplateId?: string;
    apartmentTemplateId?: string;
  } = {}) {
    const { document: starter, label } = buildLivingRoomStarterDocument({
      ...options,
      projectId: `living-room-${Date.now()}`,
      now: new Date().toISOString(),
    });
    openDocument(starter, `Created a ${label}.`, starter.objects[0]?.id);
  }

  function restoreDocument(nextDocument: InteriorProject) {
    openDocument(nextDocument, `Opened ${nextDocument.name}.`, nextDocument.objects[0]?.id);
  }

  const commitDocument = createCommitDocument(commitProjectChange);
  const ctx: EditorCommandContext = {
    document,
    commitDocument,
    selectedObjectIds,
    setSelectedObjectIds,
    setPreDropReason,
    onStatus,
  };

  return {
    livingRoomDocument: document,
    selectedInteriorObjectIds: selectedObjectIds,
    selectedInteriorObjects: selectedObjects,
    livingRoomIssues: issues,
    livingRoomProjectHomeOpen: projectHomeOpen,
    createLivingRoomStarter: createStarter,
    openLivingRoomReleaseDemo: () => restoreDocument(createLivingRoomReleaseDemoProject()),
    openLivingRoomGoldenRun: () => restoreDocument(createGoldenCabinetRunProject()),
    openPhase1Benchmark: (benchmarkId: Phase1BenchmarkId) => restoreDocument(
      createPhase1BenchmarkProject(benchmarkId),
    ),
    restoreLivingRoomDocument: restoreDocument,
    openLivingRoomProjectHome: () => setProjectHomeOpen(true),
    closeLivingRoomProjectHome: () => setProjectHomeOpen(false),
    ...objectEditingCommands(ctx),
    ...objectPlacementCommands(ctx),
    ...cabinetRunCommands(ctx),
    ...finishCommands(ctx),
    ...roomCommands(ctx),
    ...wallCommands(ctx),
    ...lightCommands(ctx),
    livingRoomPreDropReason: preDropReason,
    clearLivingRoomPreDropReason: () => setPreDropReason(null),
    patchLivingRoomDocument: commitDocument,
    currentCompatibilityRoom: room,
  };
}
