const MIN_VISIBLE = 0.6;

type Entry = { key: string; element: HTMLElement };

let entries = new Map<string, Entry>();
let observer: IntersectionObserver | null = null;
let activeTouchKey: string | null = null;
const listeners = new Set<() => void>();

function viewportCenterDistance(rect: DOMRect): number {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const mx = rect.left + rect.width / 2;
  const my = rect.top + rect.height / 2;
  return (mx - cx) ** 2 + (my - cy) ** 2;
}

function pickPrimaryTouchClip(): string | null {
  let best: { key: string; dist: number } | null = null;
  for (const { key, element } of entries.values()) {
    const rect = element.getBoundingClientRect();
    const visible = rect.height <= 0 ? 0 : Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const ratio = visible / rect.height;
    if (ratio < MIN_VISIBLE) continue;
    const dist = viewportCenterDistance(rect);
    if (!best || dist < best.dist) best = { key, dist };
  }
  return best?.key ?? null;
}

function notifyTouchPrimary() {
  const next = pickPrimaryTouchClip();
  if (next === activeTouchKey) return;
  activeTouchKey = next;
  listeners.forEach((listener) => listener());
}

function ensureObserver() {
  if (observer || typeof IntersectionObserver === "undefined") return;
  observer = new IntersectionObserver(() => notifyTouchPrimary(), { threshold: [0, 0.25, 0.5, 0.75, 1] });
  window.addEventListener("scroll", notifyTouchPrimary, { passive: true });
  window.addEventListener("resize", notifyTouchPrimary, { passive: true });
}

export function registerTouchCardClip(key: string, element: HTMLElement | null): void {
  ensureObserver();
  if (!element) {
    const prev = entries.get(key);
    if (prev) observer?.unobserve(prev.element);
    entries.delete(key);
    notifyTouchPrimary();
    return;
  }
  entries.set(key, { key, element });
  observer?.observe(element);
  notifyTouchPrimary();
}

export function getTouchPrimaryClipKey(): string | null {
  return activeTouchKey;
}

export function subscribeTouchPrimaryClip(listener: () => void): () => void {
  listeners.add(listener);
  listener();
  return () => listeners.delete(listener);
}
