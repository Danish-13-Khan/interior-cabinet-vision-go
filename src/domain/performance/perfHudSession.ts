/** Session open/close for the performance card. A reload starts closed. */

let booted = false;
let open = false;
const listeners = new Set<(value: boolean) => void>();

export function bootPerfHud(startOpen: boolean) {
  if (booted) return;
  booted = true;
  open = startOpen;
}

export function readPerfHudOpen() {
  return open;
}

export function setPerfHudOpen(next: boolean) {
  open = next;
  listeners.forEach((listener) => listener(open));
}

export function togglePerfHudOpen() {
  setPerfHudOpen(!open);
}

export function subscribePerfHud(listener: (value: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetPerfHudSessionForTests() {
  booted = false;
  open = false;
  listeners.clear();
}
