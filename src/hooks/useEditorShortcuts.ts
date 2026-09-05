import { useEffect, useRef } from "react";
import { isAppModalOpen } from "./appModalGate";
import {
  eventMatchesBinding,
  type ShortcutActionId,
  type ShortcutMap,
} from "../domain/desktopUx";

type EditorShortcutActions = {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onNew: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  onRemove: () => void;
  onToggleCommandPalette: () => void;
  onToggleShortcuts: () => void;
  onEscape: () => void;
  onViewPlan: () => void;
  onViewFront: () => void;
  onViewSide: () => void;
  onView3d: () => void;
  onToggleToolRail: () => void;
  onToggleInspector: () => void;
  onCycleWorkspace: () => void;
  onDraftSelect: () => void;
  onDraftNote: () => void;
  onDraftLeader: () => void;
  onToggleGrid: () => void;
  onRotate90: () => void;
  onCycleSnap: () => void;
};

const ACTION_KEYS: Array<[ShortcutActionId, keyof EditorShortcutActions]> = [
  ["undo", "onUndo"],
  ["redo", "onRedo"],
  ["save", "onSave"],
  ["new", "onNew"],
  ["copy", "onCopy"],
  ["paste", "onPaste"],
  ["duplicate", "onDuplicate"],
  ["selectAll", "onSelectAll"],
  ["remove", "onRemove"],
  ["commandPalette", "onToggleCommandPalette"],
  ["shortcutHelp", "onToggleShortcuts"],
  ["viewPlan", "onViewPlan"],
  ["viewFront", "onViewFront"],
  ["viewSide", "onViewSide"],
  ["view3d", "onView3d"],
  ["toggleToolRail", "onToggleToolRail"],
  ["toggleInspector", "onToggleInspector"],
  ["cycleWorkspace", "onCycleWorkspace"],
  ["draftSelect", "onDraftSelect"],
  ["draftNote", "onDraftNote"],
  ["draftLeader", "onDraftLeader"],
  ["toggleGrid", "onToggleGrid"],
  ["rotate90", "onRotate90"],
  ["cycleSnap", "onCycleSnap"],
];

const BLOCKED_WHILE_TYPING: ShortcutActionId[] = [
  "save",
  "new",
  "copy",
  "paste",
  "duplicate",
  "selectAll",
  "remove",
  "viewPlan",
  "viewFront",
  "viewSide",
  "view3d",
  "toggleToolRail",
  "toggleInspector",
  "cycleWorkspace",
  "shortcutHelp",
  "draftSelect",
  "draftNote",
  "draftLeader",
  "toggleGrid",
  "rotate90",
  "cycleSnap",
];

export function useEditorShortcuts(
  actions: EditorShortcutActions,
  shortcutMap: ShortcutMap,
) {
  const actionsRef = useRef(actions);
  const mapRef = useRef(shortcutMap);
  actionsRef.current = actions;
  mapRef.current = shortcutMap;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isAppModalOpen()) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);

      if (event.key === "Escape") {
        actionsRef.current.onEscape();
        return;
      }

      // Built-in redo alias (Ctrl/Cmd+Y) even if remapped away from Shift+Z.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        actionsRef.current.onRedo();
        return;
      }

      for (const [actionId, handlerKey] of ACTION_KEYS) {
        const binding = mapRef.current[actionId];
        if (!eventMatchesBinding(event, binding)) continue;
        if (isTypingTarget && BLOCKED_WHILE_TYPING.includes(actionId)) {
          continue;
        }
        event.preventDefault();
        const handler = actionsRef.current[handlerKey];
        handler();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
