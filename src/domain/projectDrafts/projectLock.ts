export type TabLockState = "free" | "held" | "blocked" | "taken-over";

export type TabLockEvent =
  | { type: "acquired" }
  | { type: "denied" }
  | { type: "peer-alive" }
  | { type: "takeover" }
  | { type: "released" };

export function projectLockName(projectId: string): string {
  return `cabinet-project:${projectId}`;
}

export const PROJECT_LOCK_CHANNEL = "cabinet-draft-locks";

export function reduceTabLock(state: TabLockState, event: TabLockEvent): TabLockState {
  if (event.type === "acquired") return "held";
  if (event.type === "released") return "free";
  if (event.type === "takeover" && state === "held") return "taken-over";
  if ((event.type === "denied" || event.type === "peer-alive") && state !== "held" && state !== "taken-over") {
    return "blocked";
  }
  return state;
}
