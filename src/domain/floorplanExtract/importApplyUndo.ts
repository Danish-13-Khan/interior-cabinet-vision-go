/** Banner is armed only for an in-session Apply, not a reloaded saved extract. */
export function importApplyUndoVisible(input: {
  armed: boolean;
  importHeadAt: string | null;
  projectUpdatedAt?: string;
  hasAppliedExtract: boolean;
}): boolean {
  if (!input.armed || !input.hasAppliedExtract) return false;
  if (input.importHeadAt == null) return true;
  return input.importHeadAt === input.projectUpdatedAt;
}

export function captureImportUndoHead(
  project: { updatedAt?: string; extensions?: { floorplanExtractAppliedAt?: unknown } } | null,
): string | null {
  if (!project?.updatedAt || !project.extensions?.floorplanExtractAppliedAt) return null;
  return project.updatedAt;
}
