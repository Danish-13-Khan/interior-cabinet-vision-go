const FILE_BINDINGS_KEY = "cabinet-project-file-bindings";

export function readProjectFileBindings(storage: Pick<Storage, "getItem">): Record<string, string> {
  try {
    const parsed = JSON.parse(storage.getItem(FILE_BINDINGS_KEY) ?? "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const bindings: Record<string, string> = {};
    for (const [id, path] of Object.entries(parsed)) {
      if (typeof path === "string" && path && path !== "version") bindings[id] = path;
    }
    return bindings;
  } catch {
    return {};
  }
}

/** Remember which project a disk path belongs to. Never record the literal "version" path. */
export function rememberProjectFileBinding(
  storage: Pick<Storage, "getItem" | "setItem">,
  projectId: string,
  path: string,
): void {
  if (!projectId || !path || path === "version") return;
  try {
    const bindings = readProjectFileBindings(storage);
    if (bindings[projectId] === path) return;
    bindings[projectId] = path;
    storage.setItem(FILE_BINDINGS_KEY, JSON.stringify(bindings));
  } catch {
    /* the file itself was already saved */
  }
}

export function projectIdForFile(bindings: Record<string, string>, path: string | null): string | null {
  if (!path || path === "version") return null;
  return Object.entries(bindings).find(([, value]) => value === path)?.[0] ?? null;
}

/**
 * Desktop recovery must use the draft for the open file's own project.
 * A newer draft from a different project is not paired with that file.
 */
export function chooseRecoveryProject(input: {
  entries: { id: string; updatedAt: string }[];
  openFilePath: string | null;
  bindings: Record<string, string>;
}): { projectId: string; filePath: string | null } | null {
  if (input.entries.length === 0) return null;
  if (input.openFilePath && input.openFilePath !== "version") {
    const owner = projectIdForFile(input.bindings, input.openFilePath);
    if (!owner || !input.entries.some((entry) => entry.id === owner)) return null;
    return { projectId: owner, filePath: input.openFilePath };
  }
  const latest = [...input.entries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  return latest ? { projectId: latest.id, filePath: input.bindings[latest.id] ?? null } : null;
}
