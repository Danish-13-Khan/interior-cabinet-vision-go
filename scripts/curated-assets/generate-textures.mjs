/**
 * Generate curated PBR texture PNGs for living-room materials.
 * Run: node scripts/curated-assets/generate-textures.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { texturesDir } from "./threeExport.mjs";
import { encodePngRgb } from "./writePng.mjs";

const SIZE = 256;

function writeRgb(path, fill) {
  const pixels = Buffer.alloc(SIZE * SIZE * 3);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const [r, g, b] = fill(x, y);
      const i = (y * SIZE + x) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
  writeFileSync(path, encodePngRgb(SIZE, SIZE, pixels));
}

function woodColor(base, grain) {
  return (x, y) => {
    const wave = Math.sin(y * 0.08 + x * 0.015) * 12 + Math.sin(y * 0.02) * 6;
    const band = ((x + wave) % 18 + 18) % 18 < 2 ? grain : 0;
    return [
      Math.max(0, Math.min(255, base[0] + band)),
      Math.max(0, Math.min(255, base[1] + band * 0.7)),
      Math.max(0, Math.min(255, base[2] + band * 0.4)),
    ];
  };
}

function woodNormal() {
  return (x, y) => {
    const n = Math.sin(y * 0.08 + x * 0.02) * 18;
    return [128 + n, 128 - n * 0.4, 255];
  };
}

function woodRough() {
  return (x, y) => {
    const v = 140 + Math.sin(y * 0.05) * 18 + ((x * 13 + y * 7) % 17);
    return [v, v, v];
  };
}

function fabricColor(base, contrast) {
  return (x, y) => {
    const weave = ((x % 4 < 2 ? 1 : -1) + (y % 4 < 2 ? 1 : -1)) * contrast;
    return [
      Math.max(0, Math.min(255, base[0] + weave)),
      Math.max(0, Math.min(255, base[1] + weave)),
      Math.max(0, Math.min(255, base[2] + weave * 0.8)),
    ];
  };
}

function fabricNormal() {
  return (x, y) => {
    const wx = x % 4 < 2 ? 10 : -10;
    const wy = y % 4 < 2 ? 8 : -8;
    return [128 + wx, 128 + wy, 255];
  };
}

function fabricRough(base = 210) {
  return (x, y) => {
    const weave = ((x % 4) + (y % 4)) * 3;
    const v = Math.max(0, Math.min(255, base + weave - 8));
    return [v, v, v];
  };
}

function paintColor(base) {
  return (x, y) => {
    const noise = ((x * 37 + y * 17) % 9) - 4;
    return [base[0] + noise, base[1] + noise, base[2] + noise];
  };
}

function paintNormal() {
  return (x, y) => {
    const n = ((x * 19 + y * 23) % 11) - 5;
    return [128 + n, 128 - n * 0.5, 255];
  };
}

function paintRough() {
  return (x, y) => {
    const v = 200 + ((x * 11 + y * 13) % 15) - 7;
    return [v, v, v];
  };
}

function stoneColor(base) {
  return (x, y) => {
    const speck = ((x * 29 + y * 17) % 23) - 11;
    return [
      Math.max(0, Math.min(255, base[0] + speck)),
      Math.max(0, Math.min(255, base[1] + speck * 0.85)),
      Math.max(0, Math.min(255, base[2] + speck * 0.7)),
    ];
  };
}

function stoneNormal() {
  return (x, y) => {
    const n = Math.sin(x * 0.11) * 10 + Math.cos(y * 0.09) * 8;
    return [128 + n, 128 - n * 0.6, 255];
  };
}

function stoneRough() {
  return (x, y) => {
    const v = 150 + Math.sin((x + y) * 0.07) * 20 + ((x * 7 + y * 3) % 11);
    return [v, v, v];
  };
}

function metalAo() {
  return (x, y) => {
    const cx = x - SIZE / 2;
    const cy = y - SIZE / 2;
    const d = Math.sqrt(cx * cx + cy * cy) / (SIZE * 0.5);
    const v = Math.max(80, Math.min(255, 230 - d * 90));
    return [v, v, v];
  };
}

mkdirSync(join(texturesDir, "wood"), { recursive: true });
mkdirSync(join(texturesDir, "fabric"), { recursive: true });
mkdirSync(join(texturesDir, "paint"), { recursive: true });
mkdirSync(join(texturesDir, "stone"), { recursive: true });
mkdirSync(join(texturesDir, "metal"), { recursive: true });

writeRgb(join(texturesDir, "wood/oak-color.png"), woodColor([185, 138, 88], -22));
writeRgb(join(texturesDir, "wood/oak-normal.png"), woodNormal());
writeRgb(join(texturesDir, "wood/oak-rough.png"), woodRough());
writeRgb(join(texturesDir, "wood/walnut-color.png"), woodColor([90, 57, 40], -18));
writeRgb(join(texturesDir, "wood/walnut-normal.png"), woodNormal());
writeRgb(join(texturesDir, "wood/walnut-rough.png"), woodRough());
writeRgb(join(texturesDir, "fabric/oatmeal-color.png"), fabricColor([200, 186, 166], 10));
writeRgb(join(texturesDir, "fabric/oatmeal-normal.png"), fabricNormal());
writeRgb(join(texturesDir, "fabric/oatmeal-rough.png"), fabricRough(215));
writeRgb(join(texturesDir, "fabric/olive-color.png"), fabricColor([115, 118, 90], 9));
writeRgb(join(texturesDir, "fabric/olive-normal.png"), fabricNormal());
writeRgb(join(texturesDir, "fabric/olive-rough.png"), fabricRough(212));
writeRgb(join(texturesDir, "fabric/rug-wool-color.png"), fabricColor([184, 166, 141], 12));
writeRgb(join(texturesDir, "fabric/rug-wool-normal.png"), fabricNormal());
writeRgb(join(texturesDir, "fabric/rug-wool-rough.png"), fabricRough(230));
writeRgb(join(texturesDir, "paint/wall-color.png"), paintColor([233, 227, 216]));
writeRgb(join(texturesDir, "paint/wall-normal.png"), paintNormal());
writeRgb(join(texturesDir, "paint/wall-rough.png"), paintRough());
writeRgb(join(texturesDir, "stone/warm-color.png"), stoneColor([216, 209, 197]));
writeRgb(join(texturesDir, "stone/warm-normal.png"), stoneNormal());
writeRgb(join(texturesDir, "stone/warm-rough.png"), stoneRough());
writeRgb(join(texturesDir, "metal/charcoal-ao.png"), metalAo());

console.log(`Wrote curated PBR textures to ${texturesDir}`);
