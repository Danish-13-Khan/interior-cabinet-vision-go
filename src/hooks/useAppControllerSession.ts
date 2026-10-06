import { useCallback, useEffect, useRef, useState } from "react";
import { type CabinetSceneHandle } from "../components/CabinetScene";
import {
  clampCabinetProject,
  defaultCabinetProject,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import { type PanelName } from "../domain/cabinetGeometry";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import { getActiveProjectRoom, normalizeMultiRoomProject } from "../domain/projectRooms";
import { sanitizeSelection, type EditorSnapshot } from "../domain/editorSnapshot";
import { adoptInteriorDocumentExposure } from "../domain/interiorProject/adoptStyleExposure";
import { loadInitialSessionState, useSessionPersist } from "./useSessionPersist";
import { editorStatus } from "../domain/projectDrafts/browserSignals";
import { useSessionShellState } from "./useSessionShellState";
import { useSessionProjectHistory } from "./useSessionProjectHistory";
import { useActiveOpening } from "./useActiveOpening";
import { useProjectCommit } from "./useProjectCommit";
import { useAppDerivedState } from "./useAppDerivedState";

export function useAppControllerSession() {
  const sceneRef = useRef<CabinetSceneHandle | null>(null);
  const clipboardRef = useRef<CabinetInstance[]>([]);
  const initialSession = useRef(loadInitialSessionState()).current;
  const [project, setProject] = useState<CabinetProject>(() => clampCabinetProject(defaultCabinetProject));
  const [room, setRoom] = useState<RoomConfig>(DEFAULT_ROOM);
  const shell = useSessionShellState(initialSession);
  const [selectedCabinetIds, setSelectedCabinetIds] = useState<string[]>(
    [defaultCabinetProject.cabinets[0]?.id ?? ""].filter(Boolean),
  );
  const [activeCabinetId, setActiveCabinetId] = useState<string | null>(defaultCabinetProject.cabinets[0]?.id ?? null);
  const [selectedPanelName, setSelectedPanelName] = useState<PanelName | null>(null);
  const [activeOpeningSelection, setActiveOpeningSelection] = useState<{ cabinetId: string; openingId: string } | null>(null);
  const [isolatedCabinetIds, setIsolatedCabinetIds] = useState<string[] | null>(null);
  const [projectStatus, setProjectStatusState] = useState("");
  const setProjectStatus = useCallback((status: string) => {
    setProjectStatusState(status);
    editorStatus.set(status);
  }, []);
  const [projectFilePath, setProjectFilePath] = useState<string | null>(initialSession.projectFilePath);
  const derived = useAppDerivedState({ project, room, activeCabinetId, selectedCabinetIds });

  function applySnapshot(snapshot: EditorSnapshot) {
    // Browser drafts skip the file loader, so a retired preset exposure is adopted here as well.
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(adoptInteriorDocumentExposure(snapshot.project)),
      snapshot.room,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    const safeSelection = sanitizeSelection(safeProject, snapshot.selectedCabinetIds, snapshot.activeCabinetId);
    setProject(safeProject);
    setRoom(activeRoom.config);
    setSelectedCabinetIds(safeSelection.selectedCabinetIds);
    setActiveCabinetId(safeSelection.activeCabinetId);
    setSelectedPanelName(snapshot.selectedPanelName);
    setActiveOpeningSelection(null);
  }

  function setActiveOpeningId(openingId: string | null, cabinetId?: string | null) {
    setActiveOpeningSelection(openingId && cabinetId ? { cabinetId, openingId } : null);
  }

  const history = useSessionProjectHistory({
    project, room, selectedCabinetIds, activeCabinetId, selectedPanelName,
    sceneRef, applySnapshot, onStatus: setProjectStatus, projectFilePath,
  });

  useSessionPersist({
    projectFilePath,
    workspaceTab: shell.workspaceTab,
    draftingTool: shell.draftingTool,
    selectedCabinetIds,
    activeCabinetId,
    layout: shell.layout,
  });

  const commit = useProjectCommit({
    project, room, roomBounds: derived.roomBounds, selectedCabinetIds, activeCabinetId,
    selectedPanelName, layers: derived.layers, isolatedCabinetIds,
    setProject, setSelectedCabinetIds, setActiveCabinetId, setSelectedPanelName,
    commitSnapshot: history.commitSnapshot,
  });

  const activeOpeningId = useActiveOpening(
    project, activeCabinetId, activeOpeningSelection, setActiveOpeningSelection, derived.selectedCabinet,
  );

  useEffect(() => {
    if (projectStatus.startsWith("Recovered from autosave")) return;
    const timer = window.setTimeout(() => setProjectStatus(""), 2600);
    return () => window.clearTimeout(timer);
  }, [projectStatus, setProjectStatus]);

  return {
    sceneRef, clipboardRef, initialSession, project, room,
    ...shell,
    selectedCabinetIds, activeCabinetId, activeOpeningId, selectedPanelName,
    isolatedCabinetIds, setIsolatedCabinetIds,
    projectStatus, setProjectStatus, projectFilePath, setProjectFilePath,
    ...derived, applySnapshot, ...history, ...commit, setActiveOpeningId,
  };
}
