/** One hover clip plays at a time across all cards on the page. */
let activeKey: string | null = null;
const listeners = new Set<() => void>();

export function getActiveCardClipKey(): string | null {
  return activeKey;
}

export function subscribeActiveCardClip(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function claimCardClipPlayback(key: string): void {
  if (activeKey === key) return;
  activeKey = key;
  listeners.forEach((listener) => listener());
}

export function releaseCardClipPlayback(key: string): void {
  if (activeKey !== key) return;
  activeKey = null;
  listeners.forEach((listener) => listener());
}
