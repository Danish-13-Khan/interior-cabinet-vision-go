import type { ShowroomMode } from './createScene';

export type ShowroomStart =
  | { kind: 'auto'; mode: ShowroomMode }
  | { kind: 'manual'; mode: ShowroomMode; label: string };

export type ShowroomEnvironment = {
  search: string;
  reducedMotion: boolean;
  saveData?: boolean;
};

export const POSTER_QUERY = 'showroom=poster';

/** Decide how the hero 3D starts: autoplay loop on capable devices, a Play button otherwise. */
export function resolveShowroomStart(env: ShowroomEnvironment): ShowroomStart {
  if (new URLSearchParams(env.search).get('showroom') === 'poster') return { kind: 'auto', mode: 'still' };
  if (env.reducedMotion) return { kind: 'manual', mode: 'once', label: 'Play the build' };
  // effectiveType is a rough guess that often reads slow on a fresh load; only an explicit Save-Data opts out.
  if (env.saveData) return { kind: 'manual', mode: 'loop', label: 'Load 3D preview' };
  return { kind: 'auto', mode: 'loop' };
}

export function readShowroomEnvironment(): ShowroomEnvironment {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return {
    search: window.location.search,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: connection?.saveData,
  };
}
