import { dwgPreviewDataUrl } from "../livingRoom/dwgPreviewSvg";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function underlayId(underlay: JsonRecord): string {
  return typeof underlay.id === "string" && underlay.id ? underlay.id : "planUnderlay";
}

function hiddenLayers(dwg: JsonRecord | null): string[] {
  if (!dwg || !Array.isArray(dwg.hiddenLayers)) return [];
  return dwg.hiddenLayers.filter((name): name is string => typeof name === "string");
}

/** Lift DWG preview geometry into the draft record and drop the derived data URL. */
export function splitDwgPreviews(document: unknown): { document: unknown; dwgPreviews: Record<string, unknown> } {
  const dwgPreviews: Record<string, unknown> = {};
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!isRecord(node)) return node;
    const next: JsonRecord = {};
    for (const [key, child] of Object.entries(node)) {
      if (key !== "planUnderlay" || !isRecord(child)) {
        next[key] = visit(child);
        continue;
      }
      const copy = clone(child);
      const dwg = isRecord(copy.dwg) ? copy.dwg : null;
      if (dwg && isRecord(dwg.preview)) {
        dwgPreviews[underlayId(copy)] = dwg.preview;
        delete dwg.preview;
        delete copy.dataUrl;
      }
      next[key] = copy;
    }
    return next;
  };
  return { document: visit(clone(document)), dwgPreviews };
}

type Preview = Parameters<typeof dwgPreviewDataUrl>[0];

function isPreview(value: unknown): value is Preview {
  return isRecord(value) && isRecord(value.bounds) && Array.isArray(value.layers);
}

/** Rebuild the SVG data URL the plan view expects. Inline previews still load. */
export function rebuildDwgDataUrls(document: unknown, dwgPreviews: Record<string, unknown>): unknown {
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!isRecord(node)) return node;
    const next: JsonRecord = {};
    for (const [key, child] of Object.entries(node)) {
      if (key !== "planUnderlay" || !isRecord(child)) {
        next[key] = visit(child);
        continue;
      }
      const copy = clone(child);
      const dwg = isRecord(copy.dwg) ? { ...copy.dwg } : {};
      const preview = isPreview(dwg.preview) ? dwg.preview : dwgPreviews[underlayId(copy)];
      if (isPreview(preview)) {
        const hidden = hiddenLayers(dwg);
        copy.dwg = { ...dwg, preview, hiddenLayers: hidden };
        copy.dataUrl = dwgPreviewDataUrl(preview, hidden);
      }
      next[key] = copy;
    }
    return next;
  };
  return visit(clone(document));
}
