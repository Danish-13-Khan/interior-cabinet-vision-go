import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PALETTES } from './palettes';
import { createShowroom, type ShowroomMode } from './createScene';

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
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++next, callback); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof intersection) { intersection = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());
const host = { append() {} } as unknown as HTMLElement;
const open = (mode: ShowroomMode, onStage = vi.fn()) =>
  createShowroom(host, PALETTES.oak, { mode, onStage, onError: vi.fn() });

describe('showroom render lifecycle', () => {
  it('loops the build while in view: reaches hold, then starts again from an empty floor', () => {
    const onStage = vi.fn();
    const scene = open('loop', onStage);
    intersection([{ isIntersecting: true }]);
    frames(300);
    const stages = onStage.mock.calls.map(call => call[0]);
    expect(stages).toContain('hold');
    expect(stages.lastIndexOf('empty')).toBeGreaterThan(stages.indexOf('hold'));
    expect(callbacks.size).toBe(1);
    scene.dispose();
    expect(spies.dispose).toHaveBeenCalledOnce();
  });
  it('plays once and then stops requesting frames', () => {
    const onStage = vi.fn();
    const scene = open('once', onStage);
    intersection([{ isIntersecting: true }]);
    frames(260);
    expect(onStage).toHaveBeenLastCalledWith('hold');
    expect(callbacks.size).toBe(0);
    const idle = spies.render.mock.calls.length;
    scene.setPalette(PALETTES.walnut);
    expect(spies.render.mock.calls.length).toBeGreaterThan(idle);
    scene.replay(false);
    expect(onStage).toHaveBeenLastCalledWith('empty');
    expect(callbacks.size).toBe(1);
    scene.dispose();
  });
  it('renders the finished still without animating', () => {
    const onStage = vi.fn();
    const scene = open('still', onStage);
    intersection([{ isIntersecting: true }]);
    expect(onStage).toHaveBeenCalledWith('hold');
    expect(spies.render).toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
    scene.dispose();
  });
  it('pauses off screen or when the tab is hidden, resumes, and cancels on unmount', () => {
    const scene = open('loop');
    intersection([{ isIntersecting: true }]); frames(20);
    fakeDocument.hidden = true; fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(0);
    fakeDocument.hidden = false; fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(1);
    intersection([{ isIntersecting: false }]);
    expect(callbacks.size).toBe(0);
    intersection([{ isIntersecting: true }]);
    scene.dispose(); expect(callbacks.size).toBe(0);
  });
});
