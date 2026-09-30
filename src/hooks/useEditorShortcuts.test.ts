import { describe, expect, it } from "vitest";
import { editorShortcutDisposition } from "./useEditorShortcuts";

describe("editor shortcuts", () => {
  it("runs Cmd+S while typing and cancels the browser save dialog", () => {
    expect(editorShortcutDisposition("save", true)).toEqual({ prevent: true, run: true });
    expect(editorShortcutDisposition("copy", true)).toEqual({ prevent: false, run: false });
  });
});
