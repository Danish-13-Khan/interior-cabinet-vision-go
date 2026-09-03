type InteriorsProjectsIntroProps = {
  projectName: string;
  hasCurrentProject: boolean;
  onProjectName: (value: string) => void;
  onCreate: () => void;
  onOpen: () => void;
  onReturn: () => void;
};

export function InteriorsProjectsIntro({
  projectName,
  hasCurrentProject,
  onProjectName,
  onCreate,
  onOpen,
  onReturn,
}: InteriorsProjectsIntroProps) {
  return (
    <div className="planner-v2-home-intro">
      <span>Cabinet proposal workspace</span>
      <h1>Start with the room.<br />Finish with a buildable run.</h1>
      <p>
        Create a measured room, place a cabinet run, review the price, and send the same design to
        engineering.
      </p>
      <label>
        <span>Job name</span>
        <input
          value={projectName}
          maxLength={80}
          data-testid="interiors-job-name"
          data-dialog-initial-focus
          onChange={(event) => onProjectName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCreate();
          }}
        />
      </label>
      <div className="planner-v2-home-actions">
        <button
          type="button"
          className="is-primary"
          data-testid="interiors-new-job"
          disabled={!projectName.trim()}
          onClick={onCreate}
        >
          New cabinet job
        </button>
        <button type="button" aria-label="Open project" onClick={onOpen}>
          Open
        </button>
        {hasCurrentProject ? (
          <button type="button" onClick={onReturn}>Return to project</button>
        ) : null}
      </div>
      <small className="planner-v2-home-start-note">
        Name the job, then open a blank canvas and draw the room.
      </small>
    </div>
  );
}
