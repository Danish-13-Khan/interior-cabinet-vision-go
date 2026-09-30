import { useRef } from "react";
import type { MutableRefObject } from "react";
import type { CabinetSceneHandle } from "../components/CabinetScene";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { EditorSnapshot } from "../domain/editorSnapshot";
import type { RoomConfig } from "../domain/roomModel";
import { createLivingRoomPlanThumbnail, createLivingRoomRenderThumbnail, preferLivingRoomBrowserThumbnail } from "../domain/livingRoom";
import { isTauriRuntime } from "../platform/desktopFiles";
import { captureEditorSnapshot, useEditorHistory } from "./useEditorHistory";
import { useSavedProjectBrowser } from "./useSavedProjectBrowser";

type Args = {
  project: CabinetProject;
  room: RoomConfig;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: EditorSnapshot["selectedPanelName"];
  sceneRef: MutableRefObject<CabinetSceneHandle | null>;
  applySnapshot: (snapshot: EditorSnapshot) => void;
  onStatus: (status: string) => void;
  projectFilePath: string | null;
};

export function useSessionProjectHistory(args: Args) {
  const livingRoomBrowserThumbnailRef = useRef<string | null>(null);
  const history = useEditorHistory({
    captureCurrent: () => captureEditorSnapshot(
      args.project, args.room, args.selectedCabinetIds, args.activeCabinetId, args.selectedPanelName,
    ),
    applySnapshot: args.applySnapshot,
    onStatus: args.onStatus,
  });
  const browser = useSavedProjectBrowser({
    project: args.project,
    room: args.room,
    captureThumbnail: () => {
      const plan = args.project.interiorDocument
        ? createLivingRoomPlanThumbnail(args.project.interiorDocument)
        : args.sceneRef.current?.captureThumbnail() ?? "";
      return preferLivingRoomBrowserThumbnail(livingRoomBrowserThumbnailRef.current, plan);
    },
    applySnapshot: args.applySnapshot,
    onStatus: args.onStatus,
    filePath: args.projectFilePath,
    platform: isTauriRuntime() ? "desktop" : "web",
  });
  async function setLivingRoomBrowserThumbnail(dataUrl: string) {
    livingRoomBrowserThumbnailRef.current = await createLivingRoomRenderThumbnail(dataUrl);
  }
  return { ...history, ...browser, setLivingRoomBrowserThumbnail };
}
