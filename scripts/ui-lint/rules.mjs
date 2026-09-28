// Pure CSS checks for the Calm Light style lint (docs/UI_CALM_LIGHT_ROADMAP.md §5 Phase 0).

export const MIN_FONT_PX = 12;
const ROOT_PX = 16;
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;
const RULE = /([^{}]*)\{([^{}]*)\}/g;

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

/** Blank out `@media print { … }` so paper styles keep their own sizes. */
export function stripPrintBlocks(css) {
  let out = css;
  const pattern = /@media\s+print\b[^{]*\{/g;
  let match;
  while ((match = pattern.exec(out))) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < out.length && depth > 0) {
      if (out[index] === "{") depth += 1;
      else if (out[index] === "}") depth -= 1;
      index += 1;
    }
    const blank = out.slice(match.index, index).replace(/[^\n]/g, " ");
    out = out.slice(0, match.index) + blank + out.slice(index);
  }
  return out;
}

function lineAt(css, offset) {
  return css.slice(0, offset).split("\n").length;
}

function sizeToPx(value, unit) {
  const number = Number.parseFloat(value);
  if (unit === "px") return number;
  if (unit === "rem") return number * ROOT_PX;
  if (unit === "pt") return (number * 4) / 3;
  return null;
}

/** SVG drawing text is sized in drawing units, not screen pixels. */
function isSvgRule(body) {
  return /(^|[;\s])(fill|stroke)\s*:/.test(body);
}

export function findSmallFontSizes(source) {
  const css = stripPrintBlocks(stripComments(source));
  const hits = [];
  for (const rule of css.matchAll(RULE)) {
    const body = rule[2];
    if (isSvgRule(body)) continue;
    const bodyStart = rule.index + rule[1].length + 1;
    const declarations = [
      ...body.matchAll(/font-size\s*:\s*(\d*\.?\d+)(px|rem|pt)\b/g),
      ...body.matchAll(/font\s*:[^;]*?(?<![\w.#/-])(\d*\.?\d+)(px|rem|pt)(?=\s*\/|\s)/g),
    ];
    for (const declaration of declarations) {
      const px = sizeToPx(declaration[1], declaration[2]);
      if (px !== null && px < MIN_FONT_PX) {
        hits.push({ line: lineAt(css, bodyStart + declaration.index), value: `${declaration[1]}${declaration[2]}` });
      }
    }
  }
  return hits;
}

/** Hex colours inside declaration blocks (selectors like `#root` are ignored). */
export function countHexColours(source) {
  const css = stripComments(source);
  let count = 0;
  for (const rule of css.matchAll(RULE)) count += (rule[2].match(HEX) ?? []).length;
  return count;
}

export function countImportant(source) {
  return (stripComments(source).match(/!\s*important/gi) ?? []).length;
}

/**
 * Compare one file against its baseline `[hex, important]`.
 * Returns errors (regressions) and whether the baseline can be tightened.
 */
export function checkFile({ path, source, baseline = [0, 0], allowHex = false }) {
  const errors = [];
  for (const hit of findSmallFontSizes(source)) {
    errors.push(`${path}:${hit.line} font-size ${hit.value} is below ${MIN_FONT_PX}px — use var(--text-xs) or larger`);
  }
  const hex = allowHex ? 0 : countHexColours(source);
  const important = countImportant(source);
  const [hexBase, importantBase] = baseline;
  if (hex > hexBase) {
    errors.push(`${path} has ${hex} raw hex colours (baseline ${hexBase}) — use tokens from src/styles/tokens.css`);
  }
  if (important > importantBase) {
    errors.push(`${path} has ${important} !important (baseline ${importantBase}) — no new !important`);
  }
  return { errors, counts: [hex, important], canTighten: hex < hexBase || important < importantBase };
}
