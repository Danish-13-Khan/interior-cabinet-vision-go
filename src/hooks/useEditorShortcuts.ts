import { useEffect, useRef } from "react";

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
};

export function useEditorShortcuts(actions: EditorShortcutActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const current = actionsRef.current;
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) current.onRedo();
        else current.onUndo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        current.onToggleCommandPalette();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onSave();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onNew();
        return;
      }

      if (!isTypingTarget && event.key === "?") {
        event.preventDefault();
        current.onToggleShortcuts();
        return;
      }

      if (event.key === "Escape") {
        current.onEscape();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        current.onRedo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onCopy();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onPaste();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onDuplicate();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        if (isTypingTarget) return;
        event.preventDefault();
        current.onSelectAll();
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !isTypingTarget
      ) {
        event.preventDefault();
        current.onRemove();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
