export type FloorplanGlbExportOutcome = "cache_hit" | "cache_miss" | "error";

export type FloorplanTelemetryEvent =
  | {
    type: "glb_export";
    at?: number;
    outcome: FloorplanGlbExportOutcome;
    latencyMs: number;
    fingerprint: string;
    message?: string;
  }
  | { type: "refresh_source_preview"; at?: number }
  | {
    type: "reapply_extract";
    at?: number;
    outcome: "ok" | "cancelled" | "error";
    message?: string;
  };

const MAX_EVENTS = 100;
const events: FloorplanTelemetryEvent[] = [];
const listeners = new Set<(event: FloorplanTelemetryEvent) => void>();

export function recordFloorplanTelemetry(event: FloorplanTelemetryEvent): FloorplanTelemetryEvent {
  const full: FloorplanTelemetryEvent = { ...event, at: event.at ?? Date.now() };
  events.push(full);
  while (events.length > MAX_EVENTS) events.shift();
  for (const listener of listeners) listener(full);
  return full;
}

export function listFloorplanTelemetry(): readonly FloorplanTelemetryEvent[] {
  return events;
}

export function clearFloorplanTelemetry() {
  events.length = 0;
}

export function subscribeFloorplanTelemetry(
  listener: (event: FloorplanTelemetryEvent) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function summarizeFloorplanTelemetry(list = events) {
  let cacheHits = 0;
  let cacheMisses = 0;
  let exportErrors = 0;
  let refresh = 0;
  let reapplyOk = 0;
  let reapplyCancelled = 0;
  let reapplyError = 0;
  let latencySum = 0;
  let latencyN = 0;
  for (const e of list) {
    if (e.type === "glb_export") {
      if (e.outcome === "cache_hit") cacheHits += 1;
      else if (e.outcome === "cache_miss") cacheMisses += 1;
      else exportErrors += 1;
      latencySum += e.latencyMs;
      latencyN += 1;
    } else if (e.type === "refresh_source_preview") {
      refresh += 1;
    } else if (e.type === "reapply_extract") {
      if (e.outcome === "ok") reapplyOk += 1;
      else if (e.outcome === "cancelled") reapplyCancelled += 1;
      else reapplyError += 1;
    }
  }
  return {
    cacheHits,
    cacheMisses,
    exportErrors,
    refresh,
    reapplyOk,
    reapplyCancelled,
    reapplyError,
    avgExportLatencyMs: latencyN ? latencySum / latencyN : 0,
    count: list.length,
  };
}
