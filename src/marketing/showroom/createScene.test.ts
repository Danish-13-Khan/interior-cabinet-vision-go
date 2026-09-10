import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PALETTES } from './palettes';
import { createShowroom } from './createScene';

const spies = vi.hoisted(() => ({ render: vi.fn(), dispose: vi.fn() }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    domElement = Object.assign(new EventTarget(), { setAttribute() {}, remove() {}, setPointerCapture() {} });
    shadowMap = {};
    setPixelRatio() {} setSize() {} forceContextLoss() {}
    render = spies.render; dispose = spies.dispose;
  } };
});
let callbacks: Map<number, FrameRequestCallback>, next: number;
let intersection: (entries: { isIntersecting: boolean }[]) => void;
let fakeDocument: EventTarget & { hidden: boolean };
let clock: number;
function frames(count: number) {
  for (let i = 0; i < count; i++) {
    clock += 40;
    const queue = [...callbacks.values()]; callbacks.clear();
    queue.forEach(callback => callback(clock));
  }
}
beforeEach(() => {
  callbacks = new Map(); next = 0; clock = 0; vi.clearAllMocks();
  fakeDocument = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', fakeDocument);
  vi.stubGlobal('window', { devicePixelRatio: 2 });
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++next, callback); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof intersection) { intersection = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());
const host = { append() {} } as unknown as HTMLElement;

describe('showroom render lifecycle', () => {
  it('completes assembly and drawer animation, then stops requesting frames', () => {
    const status = vi.fn();
    const scene = createShowroom(host, PALETTES.midnight, status, vi.fn());
    intersection([{ isIntersecting: true }]); frames(200);
    expect(status).toHaveBeenLastCalledWith('Assembled · drag to rotate');
    expect(callbacks.size).toBe(0);
    const idleRenders = spies.render.mock.calls.length; frames(10);
    expect(spies.render).toHaveBeenCalledTimes(idleRenders);
    scene.setDrawer(true); frames(30); expect(callbacks.size).toBe(0);
    scene.setPalette(PALETTES.gallery); expect(spies.render.mock.calls.length).toBeGreaterThan(idleRenders);
    scene.dispose(); expect(spies.dispose).toHaveBeenCalledOnce();
  });
  it('pauses when hidden, resumes, and cancels pending work on unmount', () => {
    const scene = createShowroom(host, PALETTES.forest, vi.fn(), vi.fn());
    intersection([{ isIntersecting: true }]); frames(20);
    fakeDocument.hidden = true; fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(0);
    fakeDocument.hidden = false; fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(1);
    scene.dispose(); expect(callbacks.size).toBe(0);
  });
});
