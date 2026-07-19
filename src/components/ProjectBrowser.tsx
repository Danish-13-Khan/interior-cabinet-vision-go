type SavedProjectCard = {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
};

type ProjectBrowserProps = {
  projects: SavedProjectCard[];
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onLoadProject: (projectId: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onSaveCurrent: () => void | Promise<void>;
};

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

export function ProjectBrowser({
  projects,
  onDeleteProject,
  onDuplicateProject,
  onLoadProject,
  onRenameProject,
  onSaveCurrent,
}: ProjectBrowserProps) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Saved Projects</h2>
        <span>{projects.length} saved</span>
      </div>

      <div className="project-actions">
        <button type="button" onClick={() => onSaveCurrent()}>
          Save Current
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="project-browser-grid">
          {projects.map((project) => (
            <article key={project.id} className="project-browser-card">
              <button
                type="button"
                className="project-browser-thumb"
                onClick={() => onLoadProject(project.id)}
                aria-label={`Open ${project.name}`}
              >
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.name} />
                ) : (
                  <span>No preview</span>
                )}
              </button>
              <div className="project-browser-meta">
                <strong>{project.name}</strong>
                <span>{formatSavedAt(project.updatedAt)}</span>
              </div>
              <div className="project-browser-actions">
                <button type="button" onClick={() => onLoadProject(project.id)}>
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newName = window.prompt("Rename project:", project.name);
                    if (newName && newName.trim()) {
                      onRenameProject(project.id, newName.trim());
                    }
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateProject(project.id)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="helper-note">
          Save the current room once and it will appear here with a thumbnail preview.
        </p>
      )}
    </div>
  );
}
