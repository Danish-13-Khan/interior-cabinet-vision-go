import { HISTORY_LIMIT, type EditorSnapshot } from "../domain/editorSnapshot";

export type EditorHistoryStacks = {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
};

/** Push current onto past and clear redo — same stack mutation as useEditorHistory.commitSnapshot. */
export function commitEditorHistoryStacks(
  stacks: EditorHistoryStacks,
  current: EditorSnapshot,
): EditorHistoryStacks {
  return {
    past: [...stacks.past, current].slice(-HISTORY_LIMIT),
    future: [],
  };
}

/** Pop past onto future — same stack mutation as useEditorHistory.handleUndo. */
export function undoEditorHistoryStacks(
  stacks: EditorHistoryStacks,
  current: EditorSnapshot,
): { stacks: EditorHistoryStacks; restore: EditorSnapshot | null } {
  const previous = stacks.past[stacks.past.length - 1];
  if (!previous) return { stacks, restore: null };
  return {
    stacks: {
      past: stacks.past.slice(0, -1),
      future: [current, ...stacks.future].slice(0, HISTORY_LIMIT),
    },
    restore: previous,
  };
}

/** Pop future onto past — same stack mutation as useEditorHistory.handleRedo. */
export function redoEditorHistoryStacks(
  stacks: EditorHistoryStacks,
  current: EditorSnapshot,
): { stacks: EditorHistoryStacks; restore: EditorSnapshot | null } {
  const next = stacks.future[0];
  if (!next) return { stacks, restore: null };
  return {
    stacks: {
      past: [...stacks.past, current].slice(-HISTORY_LIMIT),
      future: stacks.future.slice(1),
    },
    restore: next,
  };
}
