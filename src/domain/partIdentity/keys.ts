import type { ConstructionKey } from "./types";

export function formatCutlistKey(cabinetId: string, constructionKey: ConstructionKey) {
  return `${cabinetId}:${constructionKey}`;
}

export function partTreeNodeId(
  cabinetId: string,
  constructionKey: ConstructionKey,
  roomId = "room",
) {
  return `part:${roomId}:${cabinetId}:${constructionKey}`;
}

/** Split `cabinetId:constructionKey`. Construction keys themselves contain no colon. */
export function parseCutlistKey(key: string): { cabinetId: string; constructionKey: string } | null {
  const splitAt = key.indexOf(":");
  if (splitAt <= 0 || splitAt === key.length - 1) return null;
  return {
    cabinetId: key.slice(0, splitAt),
    constructionKey: key.slice(splitAt + 1),
  };
}

export function parsePartTreeNodeId(id: string): {
  roomId: string;
  cabinetId: string;
  constructionKey: string;
} | null {
  const match = /^part:([^:]+):([^:]+):(.+)$/.exec(id);
  if (!match) return null;
  return { roomId: match[1]!, cabinetId: match[2]!, constructionKey: match[3]! };
}
