export type PdfMediaBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfPageStream = {
  mediaBox: PdfMediaBox;
  content: string;
};

const A4_PT = { width: 595.28, height: 841.89 };

function latin1(bytes: Uint8Array) {
  return new TextDecoder("latin1").decode(bytes);
}

function indexOfAscii(haystack: Uint8Array, needle: string, from = 0) {
  const target = new TextEncoder().encode(needle);
  outer: for (let i = from; i <= haystack.length - target.length; i += 1) {
    for (let j = 0; j < target.length; j += 1) {
      if (haystack[i + j] !== target[j]) continue outer;
    }
    return i;
  }
  return -1;
}

async function inflateFlate(data: Uint8Array): Promise<Uint8Array> {
  const tryFormat = async (format: CompressionFormat) => {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  };
  try {
    return await tryFormat("deflate");
  } catch {
    return tryFormat("deflate-raw");
  }
}

function dictNumber(dict: string, key: string) {
  const match = dict.match(new RegExp(`/${key}\\s+(\\d+)`));
  return match ? Number(match[1]) : null;
}

function dictRefs(dict: string, key: string) {
  const section = dict.match(new RegExp(`/${key}\\s*(\\[([^\\]]*)\\]|\\d+\\s+0\\s+R)`));
  if (!section) return [];
  return [...section[1].matchAll(/(\d+)\s+0\s+R/g)].map((item) => Number(item[1]));
}

function mediaBox(dict: string): PdfMediaBox {
  const match = dict.match(/\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/);
  if (!match) return { x: 0, y: 0, width: A4_PT.width, height: A4_PT.height };
  const x = Number(match[1]);
  const y = Number(match[2]);
  return { x, y, width: Number(match[3]) - x, height: Number(match[4]) - y };
}

function objectSpan(bytes: Uint8Array, id: number) {
  const start = indexOfAscii(bytes, `${id} 0 obj`);
  if (start < 0) return null;
  const end = indexOfAscii(bytes, "endobj", start);
  if (end < 0) return null;
  return { start, end, body: bytes.subarray(start, end) };
}

async function decodeStream(bytes: Uint8Array, id: number): Promise<string> {
  const span = objectSpan(bytes, id);
  if (!span) return "";
  const streamAt = indexOfAscii(span.body, "stream");
  if (streamAt < 0) return "";
  const dict = latin1(span.body.subarray(0, streamAt));
  let dataStart = streamAt + 6;
  if (span.body[dataStart] === 13) dataStart += 1;
  if (span.body[dataStart] === 10) dataStart += 1;
  const length = dictNumber(dict, "Length");
  const raw = length != null
    ? span.body.subarray(dataStart, dataStart + length)
    : span.body.subarray(dataStart, indexOfAscii(span.body, "endstream"));
  const decoded = /\/Filter\s*\/FlateDecode/.test(dict) ? await inflateFlate(raw) : raw;
  return latin1(decoded);
}

export function countPdfPages(bytes: Uint8Array) {
  return (latin1(bytes).match(/\/Type\s*\/Page(?!s)\b/g) ?? []).length;
}

export async function parsePdfPages(bytes: Uint8Array): Promise<PdfPageStream[]> {
  const source = latin1(bytes);
  const pages: PdfPageStream[] = [];
  const ids = [...source.matchAll(/(\d+) 0 obj/g)].map((item) => Number(item[1]));
  for (const id of ids) {
    const span = objectSpan(bytes, id);
    if (!span) continue;
    const header = latin1(span.body.subarray(0, 400));
    if (!/\/Type\s*\/Page(?!s)\b/.test(header)) continue;
    const contents: string[] = [];
    for (const ref of dictRefs(header, "Contents")) {
      contents.push(await decodeStream(bytes, ref));
    }
    pages.push({ mediaBox: mediaBox(header), content: contents.join("\n") });
  }
  return pages;
}
