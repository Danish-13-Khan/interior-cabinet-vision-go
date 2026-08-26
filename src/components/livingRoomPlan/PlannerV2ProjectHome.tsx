import { useMemo, useState } from "react";
import { createLivingRoomPlanThumbnail, type LivingRoomStyleId } from "../../domain/livingRoom";
import type { LivingRoomPlanWorkspaceProps, PlannerStarterTemplate } from "./workspaceProps";

type PlannerV2ProjectHomeProps = {
  workspace: LivingRoomPlanWorkspaceProps;
  open: boolean;
  hasCurrentProject: boolean;
};

export function PlannerV2ProjectHome({ workspace, open, hasCurrentProject }: PlannerV2ProjectHomeProps) {
  const [projectName, setProjectName] = useState("Living room concept");
  const recentProjects = useMemo(() => workspace.recentProjects.filter((entry) => entry.project.interiorDocument).slice(0, 3), [workspace.recentProjects]);
  if (!open) return null;

  function createProject(template: PlannerStarterTemplate = "blank-room", styleId: LivingRoomStyleId = "warm-contemporary") {
    const name = projectName.trim();
    if (!name) return;
    workspace.onDiscardRecovery();
    workspace.onCreateStarter({ projectName: name, styleId, template });
  }

  return (
    <section className="planner-v2-home" role="dialog" aria-modal="true" aria-label="Start a living room project">
      <div className="planner-v2-home-intro">
        <span>Simple room planner</span>
        <h1>Design the room.<br />Build with confidence.</h1>
        <p>Start with a blank room or continue a project. The same layout powers plan, model, renders, and workshop outputs.</p>
        <label>
          <span>Project name</span>
          <input value={projectName} maxLength={80} onChange={(event) => setProjectName(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") createProject();
          }} />
        </label>
        <div className="planner-v2-home-actions">
          <button type="button" className="is-primary" disabled={!projectName.trim()} onClick={() => createProject()}>Create a room</button>
          <button type="button" onClick={workspace.onOpenProject}>Open project</button>
          {hasCurrentProject ? <button type="button" onClick={workspace.onCloseProjectHome}>Return to project</button> : null}
        </div>
        <small className="planner-v2-home-start-note">Enter a name, then create a room to begin in 2D Build.</small>
      </div>

      <div className="planner-v2-home-content">
        {workspace.recovery ? (
          <section className="planner-v2-recovery">
            <div><span>Autosave available</span><strong>{workspace.recovery.project.name}</strong></div>
            <button type="button" className="is-primary" onClick={workspace.onRestoreRecovery}>Restore</button>
            <button type="button" onClick={workspace.onDiscardRecovery}>Discard</button>
          </section>
        ) : null}
        <section className="planner-v2-starts">
          <header><span>Start from</span><small>Choose the simplest way in</small></header>
          <div>
            <button type="button" onClick={() => createProject("blank-room")}><strong>Blank room</strong><small>Set exact room dimensions in Build.</small></button>
            <button type="button" onClick={() => createProject("wardrobe-wall")}><strong>Wardrobe wall</strong><small>Start a cabinet-led room concept.</small></button>
            <button type="button" onClick={() => createProject("import-plan", "nordic-light")}><strong>Import a plan</strong><small>Use a PNG, JPG, or WebP tracing underlay.</small></button>
          </div>
        </section>
        <section className="planner-v2-recents">
          <header><span>Open recent</span><small>{recentProjects.length ? "Continue where you left off" : "Your saved projects will appear here"}</small></header>
          <button type="button" className="planner-v2-demo" onClick={() => {
            workspace.onDiscardRecovery();
            workspace.onOpenDemo();
          }}>OPEN RELEASE DEMO</button>
          {recentProjects.length ? <div>{recentProjects.map((entry) => {
            const document = entry.project.interiorDocument!;
            const preview = entry.thumbnail || createLivingRoomPlanThumbnail(document);
            return <button type="button" key={entry.id} onClick={() => workspace.onOpenRecentProject(entry.id)}>
              <img src={preview} alt="" /><strong>{entry.name}</strong><small>{document.objects.length} furniture objects · {document.rooms.length} room</small>
            </button>;
          })}</div> : <p>Save a project to keep it here for quick access.</p>}
        </section>
      </div>
    </section>
  );
}
