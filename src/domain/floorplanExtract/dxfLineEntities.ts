export type DxfLineMm = { x1: number; y1: number; x2: number; y2: number };

/** Minimal ASCII DXF LINE reader for golden fixtures — not a CAD importer. */
export function parseDxfLineEntities(text: string): DxfLineMm[] {
  const rows = text.replace(/\r\n/g, "\n").split("\n").map((row) => row.trim());
  const out: DxfLineMm[] = [];
  let i = 0;
  while (i < rows.length - 1) {
    if (rows[i] !== "0" || rows[i + 1] !== "LINE") {
      i += 1;
      continue;
    }
    i += 2;
    const fields: Record<string, number> = {};
    while (i < rows.length - 1 && rows[i] !== "0") {
      fields[rows[i]] = Number(rows[i + 1]);
      i += 2;
    }
    if (fields["10"] == null || fields["20"] == null || fields["11"] == null || fields["21"] == null) continue;
    out.push({ x1: fields["10"], y1: fields["20"], x2: fields["11"], y2: fields["21"] });
  }
  return out;
}

export function undirectedSegmentKey(line: DxfLineMm): string {
  const a = `${line.x1},${line.y1}`;
  const b = `${line.x2},${line.y2}`;
  return a < b ? `${a}>${b}` : `${b}>${a}`;
}
