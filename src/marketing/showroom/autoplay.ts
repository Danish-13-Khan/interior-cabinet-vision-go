import type { ShowroomMode } from './createScene';

export type ShowroomStart =
  | { kind: 'auto'; mode: ShowroomMode }
  | { kind: 'manual'; mode: ShowroomMode; label: string };

export type ShowroomEnvironment = {
  search: string;
  reducedMotion: boolean;
  saveData?: boolean;
  effectiveType?: string;
};

export const POSTER_QUERY = 'showroom=poster';

/** Decide how the hero 3D starts: autoplay loop on capable devices, a Play button otherwise. */
export function resolveShowroomStart(env: ShowroomEnvironment): ShowroomStart {
  if (new URLSearchParams(env.search).get('showroom') === 'poster') return { kind: 'auto', mode: 'still' };
  if (env.reducedMotion) return { kind: 'manual', mode: 'once', label: 'Play the build' };
  if (env.saveData || /(^|-)2g$/.test(env.effectiveType ?? '')) return { kind: 'manual', mode: 'loop', label: 'Load 3D preview' };
  return { kind: 'auto', mode: 'loop' };
}

export function readShowroomEnvironment(): ShowroomEnvironment {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return {
    search: window.location.search,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: connection?.saveData,
    effectiveType: connection?.effectiveType,
  };
}
