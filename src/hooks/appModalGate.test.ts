import { describe, expect, it } from "vitest";
import { beginAppModal, isAppModalOpen, isEditorShortcutKey } from "./appModalGate";

function keyEvent(partial: Partial<KeyboardEvent> & Pick<KeyboardEvent, "key">) {
  return {
    key: partial.key,
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    target: partial.target ?? null,
  } as KeyboardEvent;
}

/** Stand-in for a focused prompt <input> (Node vitest has no document/jsdom by default). */
function typingInput() {
  return { tagName: "INPUT" } as unknown as HTMLInputElement;
}

function buttonTarget() {
  return { tagName: "BUTTON" } as unknown as HTMLButtonElement;
}

describe("appModalGate", () => {
  it("tracks nested modal open depth", () => {
    expect(isAppModalOpen()).toBe(false);
    const end1 = beginAppModal();
    expect(isAppModalOpen()).toBe(true);
    const end2 = beginAppModal();
    expect(isAppModalOpen()).toBe(true);
    end2();
    expect(isAppModalOpen()).toBe(true);
    end1();
    expect(isAppModalOpen()).toBe(false);
  });

  it("flags Ctrl/Cmd+Z and Delete as editor shortcuts outside inputs", () => {
    expect(isEditorShortcutKey(keyEvent({ key: "z", ctrlKey: true }))).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "z", metaKey: true, shiftKey: true }))).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "Delete" }))).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "a" }))).toBe(false);
  });

  it("allows native text-editing shortcuts inside an input when allowTypingDefaults is on", () => {
    const input = typingInput();
    const opts = { allowTypingDefaults: true } as const;
    for (const key of ["c", "v", "x", "a", "z", "y"] as const) {
      expect(isEditorShortcutKey(keyEvent({ key, ctrlKey: true, target: input }), opts)).toBe(false);
      expect(isEditorShortcutKey(keyEvent({ key, metaKey: true, target: input }), opts)).toBe(false);
    }
    // Workspace commands stay blocked even while typing in the prompt field.
    expect(isEditorShortcutKey(keyEvent({ key: "s", ctrlKey: true, target: input }), opts)).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "n", metaKey: true, target: input }), opts)).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "d", ctrlKey: true, target: input }), opts)).toBe(true);
    expect(isEditorShortcutKey(keyEvent({ key: "Backspace", target: input }), opts)).toBe(false);
    expect(isEditorShortcutKey(keyEvent({ key: "Delete", target: input }), opts)).toBe(false);
  });

  it("still blocks Ctrl/Cmd+Z on non-input targets when allowTypingDefaults is on", () => {
    expect(
      isEditorShortcutKey(keyEvent({ key: "z", ctrlKey: true, target: buttonTarget() }), {
        allowTypingDefaults: true,
      }),
    ).toBe(true);
  });
});
