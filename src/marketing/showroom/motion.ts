export const ASSEMBLY_SECONDS = 6;
export function easeOut(value: number) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3); }
export function assemblyProgress(seconds: number, delay: number) { return easeOut((seconds - delay) / 1.2); }
export function lightProgress(seconds: number) { return easeOut((seconds - 4.4) / 1.2); }
