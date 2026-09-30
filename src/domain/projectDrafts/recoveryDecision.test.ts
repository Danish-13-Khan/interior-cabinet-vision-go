import { describe, expect, it } from "vitest";
import { decideDraftRecovery, recoveredAutosaveNotice } from "./recoveryDecision";
import { reduceTabLock } from "./projectLock";

const formatTime = () => "4:58 PM";

describe("draft recovery", () => {
  it("opens the web draft without asking and names the autosave time when a write was still pending", () => {
    expect(decideDraftRecovery({
      platform: "web", filePath: null, draftUpdatedAt: "2026-09-29T11:28:00.000Z", lastFileSaveAt: null, pending: true, formatTime,
    })).toEqual({ action: "open-draft", notice: "Recovered from autosave at 4:58 PM" });
    expect(decideDraftRecovery({
      platform: "web", filePath: null, draftUpdatedAt: "2026-09-29T11:28:00.000Z", lastFileSaveAt: null, pending: false, formatTime,
    }).notice).toBeNull();
  });

  it("asks on desktop only when the draft is newer than the last file save", () => {
    expect(decideDraftRecovery({
      platform: "desktop", filePath: "/tmp/room.cabinet", draftUpdatedAt: "2026-09-29T12:00:00.000Z", lastFileSaveAt: "2026-09-29T11:00:00.000Z", pending: true, formatTime,
    })).toEqual({ action: "ask", prompt: "Restore unsaved changes from 4:58 PM?" });
    expect(decideDraftRecovery({
      platform: "desktop", filePath: "/tmp/room.cabinet", draftUpdatedAt: "2026-09-29T11:00:00.000Z", lastFileSaveAt: "2026-09-29T12:00:00.000Z", pending: true, formatTime,
    }).action).toBe("none");
    expect(decideDraftRecovery({
      platform: "desktop", filePath: null, draftUpdatedAt: "2026-09-29T12:00:00.000Z", lastFileSaveAt: null, pending: false, formatTime,
    }).action).toBe("open-draft");
  });

  it("formats the recovered notice from the draft timestamp", () => {
    expect(recoveredAutosaveNotice("2026-09-29T11:28:00.000Z", formatTime)).toBe("Recovered from autosave at 4:58 PM");
  });
});

describe("project tab lock", () => {
  it("blocks a second tab and lets take over stop the first", () => {
    expect(reduceTabLock("free", { type: "denied" })).toBe("blocked");
    expect(reduceTabLock("free", { type: "peer-alive" })).toBe("blocked");
    expect(reduceTabLock("blocked", { type: "acquired" })).toBe("held");
    expect(reduceTabLock("held", { type: "takeover" })).toBe("taken-over");
    expect(reduceTabLock("taken-over", { type: "peer-alive" })).toBe("taken-over");
  });
});
