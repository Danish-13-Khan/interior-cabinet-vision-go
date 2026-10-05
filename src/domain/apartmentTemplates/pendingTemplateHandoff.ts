/** Register → editor handoff so the chosen template opens after sign-up. */
export const PENDING_TEMPLATE_STORAGE_KEY = "cabinet-designer:pending-template";

export type PendingTemplateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Browser session storage, or null outside a window (Node / CI never touches a global). */
export function defaultPendingTemplateStorage(): PendingTemplateStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function stashPendingTemplate(
  templateId: string,
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
): void {
  try {
    storage?.setItem(PENDING_TEMPLATE_STORAGE_KEY, templateId);
  } catch {
    // Private mode / quota: the handoff is best-effort.
  }
}

/** Read without clearing (show a prompt before the user commits to a project). */
export function peekPendingTemplate(
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
): string | null {
  try {
    return storage?.getItem(PENDING_TEMPLATE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearPendingTemplate(
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
): void {
  try {
    storage?.removeItem(PENDING_TEMPLATE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Read and clear the stashed template id (catalog or apartment). */
export function takePendingTemplate(
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
): string | null {
  const id = peekPendingTemplate(storage);
  if (id) clearPendingTemplate(storage);
  return id;
}
