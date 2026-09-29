import { useProjectTabLock } from "../hooks/useProjectTabLock";

export function ProjectTabLockNotice({ projectId }: { projectId: string | null }) {
  const { state, takeOver } = useProjectTabLock(projectId);
  if (state !== "blocked" && state !== "taken-over") return null;
  return (
    <div className="project-tab-lock" role="status" data-testid="project-tab-lock">
      <strong>{state === "blocked" ? "Open in another tab" : "Opened in another tab"}</strong>
      {state === "blocked" ? (
        <button type="button" data-testid="project-tab-takeover" onClick={takeOver}>Take over</button>
      ) : null}
    </div>
  );
}
