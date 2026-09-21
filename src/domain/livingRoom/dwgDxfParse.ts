import type { DwgDatabase, DwgEntity } from "@mlightcad/libredwg-web";

type Fields = Map<number, string[]>;
const STRUCT = new Set(["SECTION", "ENDSEC", "TABLE", "ENDTAB", "BLOCK", "ENDBLK", "EOF"]);

function last(fields: Fields, code: number, fallback = "0") {
  const values = fields.get(code);
  return values?.[values.length - 1] ?? fallback;
}

function num(fields: Fields, code: number, fallback = 0) {
  const value = Number(last(fields, code, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function point(fields: Fields, x: number, y: number, z: number) {
  return { x: num(fields, x), y: num(fields, y), z: num(fields, z) };
}

function entity(value: object): DwgEntity {
  return value as unknown as DwgEntity;
}

type Group = { code: number; value: string };

function lwVertices(ordered: Group[]) {
  const vertices: { x: number; y: number; bulge: number }[] = [];
  let current: { x: number; y?: number; bulge: number } | null = null;
  const flush = () => {
    if (current && Number.isFinite(current.y)) {
      vertices.push({ x: current.x, y: current.y!, bulge: current.bulge });
    }
    current = null;
  };
  for (const group of ordered) {
    if (group.code === 10) {
      flush();
      current = { x: Number(group.value) || 0, bulge: 0 };
    } else if (group.code === 20 && current) current.y = Number(group.value) || 0;
    else if (group.code === 42 && current) current.bulge = Number(group.value) || 0;
  }
  flush();
  return vertices;
}

function toEntity(type: string, fields: Fields, ordered: Group[]): DwgEntity {
  const layer = last(fields, 8, "0");
  if (type === "LINE") {
    return entity({ type, layer, startPoint: point(fields, 10, 20, 30), endPoint: point(fields, 11, 21, 31) });
  }
  if (type === "INSERT") {
    return entity({
      type, layer, name: last(fields, 2), insertionPoint: point(fields, 10, 20, 30),
      xScale: num(fields, 41, 1) || 1, yScale: num(fields, 42, 1) || 1,
      rotation: num(fields, 50) * Math.PI / 180, rowCount: 1, columnCount: 1,
    });
  }
  if (type === "LWPOLYLINE") {
    return entity({ type, layer, flag: num(fields, 70) & 1 ? 512 : 0, vertices: lwVertices(ordered) });
  }
  if (type === "CIRCLE" || type === "ARC") {
    return entity({
      type, layer, center: point(fields, 10, 20, 30), radius: num(fields, 40),
      startAngle: num(fields, 50) * Math.PI / 180, endAngle: num(fields, 51) * Math.PI / 180,
    });
  }
  return entity({ type, layer });
}

type BlockRecord = { name: string; flags: number; basePoint: { x: number; y: number }; entities: DwgEntity[] };

/** ASCII DXF subset for underlay geometry. LibreDWG WASM cannot read DXF. */
export function parseAsciiDxf(text: string): DwgDatabase {
  const head = text.slice(0, 120);
  if (!/^\s*0\s/m.test(head) || !/SECTION/i.test(head)) {
    throw new Error("This DXF is not a readable ASCII drawing.");
  }
  const lines = text.split(/\r?\n/);
  let insunits: number | undefined;
  let section = "";
  let table = "";
  let headerVar = "";
  let type = "";
  let fields: Fields = new Map();
  let ordered: Group[] = [];
  const layers: { name: string; off?: boolean; frozen?: boolean }[] = [];
  const blocks: BlockRecord[] = [];
  const entities: DwgEntity[] = [];
  let block: BlockRecord | null = null;

  function dest() {
    if (section === "BLOCKS" && block) return block.entities;
    if (section === "ENTITIES") return entities;
    return null;
  }

  function flush() {
    if (type === "LAYER" && table === "LAYER") {
      const flags = num(fields, 70);
      layers.push({ name: last(fields, 2, "0"), off: Boolean(flags & 1), frozen: Boolean(flags & 2) });
    } else if (type && !STRUCT.has(type)) {
      dest()?.push(toEntity(type, fields, ordered));
    }
    type = "";
    fields = new Map();
    ordered = [];
  }

  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number(lines[index]!.trim());
    const value = (lines[index + 1] ?? "").trim();
    if (!Number.isFinite(code)) continue;
    if (code === 0) {
      flush();
      type = value;
      if (type === "SECTION") section = "";
      else if (type === "ENDSEC") { section = ""; table = ""; block = null; }
      else if (type === "TABLE" || type === "ENDTAB") table = "";
      else if (type === "BLOCK") block = { name: "", flags: 0, basePoint: { x: 0, y: 0 }, entities: [] };
      else if (type === "ENDBLK") {
        if (block?.name) blocks.push(block);
        block = null;
      }
      continue;
    }
    if (type === "SECTION" && code === 2) section = value;
    if (type === "TABLE" && code === 2) table = value;
    if (section === "HEADER" && code === 9) headerVar = value;
    if (section === "HEADER" && headerVar === "$INSUNITS" && code === 70) {
      const parsed = Number(value);
      if (Number.isInteger(parsed)) insunits = parsed;
    }
    if (type === "BLOCK" && block) {
      if (code === 2) block.name = value;
      if (code === 10) block.basePoint = { ...block.basePoint, x: Number(value) || 0 };
      if (code === 20) block.basePoint = { ...block.basePoint, y: Number(value) || 0 };
    }
    const list = fields.get(code) ?? [];
    list.push(value);
    fields.set(code, list);
    ordered.push({ code, value });
  }
  flush();
  return {
    header: { INSUNITS: insunits },
    entities,
    tables: { LAYER: { entries: layers }, BLOCK_RECORD: { entries: blocks } },
  } as DwgDatabase;
}
