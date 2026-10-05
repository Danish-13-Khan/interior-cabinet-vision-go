/** Register → editor handoff so the chosen template opens after sign-up. */
export const PENDING_TEMPLATE_STORAGE_KEY = "cabinet-designer:pending-template";

export function stashPendingTemplate(templateId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_TEMPLATE_STORAGE_KEY, templateId);
}

/** Read and clear the stashed template id (catalog or apartment). */
export function takePendingTemplate(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const id = sessionStorage.getItem(PENDING_TEMPLATE_STORAGE_KEY);
  if (id) sessionStorage.removeItem(PENDING_TEMPLATE_STORAGE_KEY);
  return id;
}
