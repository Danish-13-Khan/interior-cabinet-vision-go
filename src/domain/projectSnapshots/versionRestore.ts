/**
 * Restoring a version must not point Save or Recent files at another project's path,
 * or at the literal "version" placeholder. The file on disk is unchanged, so the result stays dirty.
 */
export function versionRestorePlan(input: {
  currentPath: string | null;
  currentProjectId: string | null;
  restoredProjectId: string | null;
}): { path: string | null; rememberPath: null; markClean: false } {
  const sameProject = Boolean(input.currentProjectId) && input.currentProjectId === input.restoredProjectId;
  const usable = Boolean(input.currentPath) && input.currentPath !== "version";
  return {
    path: sameProject && usable ? input.currentPath : null,
    rememberPath: null,
    markClean: false,
  };
}
