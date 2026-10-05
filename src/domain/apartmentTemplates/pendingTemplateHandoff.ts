/** Register → editor handoff so the chosen template opens after sign-up. */
export const PENDING_TEMPLATE_STORAGE_KEY = "cabinet-designer:pending-template";

/** Keep the handoff across tabs for about a week. */
export const PENDING_TEMPLATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PendingTemplateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type PendingPayload = { templateId: string; expiresAt: number };

/** Browser localStorage, or null outside a window (Node / CI never touches a global). */
export function defaultPendingTemplateStorage(): PendingTemplateStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function writePayload(
  storage: PendingTemplateStorage | null,
  payload: PendingPayload,
): void {
  try {
    storage?.setItem(PENDING_TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota: the handoff is best-effort.
  }
}

function readPayload(
  storage: PendingTemplateStorage | null,
  now: number,
): PendingPayload | null {
  try {
    const raw = storage?.getItem(PENDING_TEMPLATE_STORAGE_KEY) ?? null;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PendingPayload;
      if (!parsed || typeof parsed.templateId !== "string") return null;
      if (typeof parsed.expiresAt === "number" && parsed.expiresAt < now) {
        clearPendingTemplate(storage);
        return null;
      }
      return parsed;
    } catch {
      // Legacy plain-string value from sessionStorage era.
      return { templateId: raw, expiresAt: now + PENDING_TEMPLATE_TTL_MS };
    }
  } catch {
    return null;
  }
}

export function stashPendingTemplate(
  templateId: string,
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
  now: number = Date.now(),
): void {
  writePayload(storage, { templateId, expiresAt: now + PENDING_TEMPLATE_TTL_MS });
}

/** Read without clearing (show a prompt before the user commits to a project). */
export function peekPendingTemplate(
  storage: PendingTemplateStorage | null = defaultPendingTemplateStorage(),
  now: number = Date.now(),
): string | null {
  return readPayload(storage, now)?.templateId ?? null;
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
  now: number = Date.now(),
): string | null {
  const id = peekPendingTemplate(storage, now);
  if (id) clearPendingTemplate(storage);
  return id;
}
