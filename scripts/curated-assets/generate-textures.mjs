/**
 * Generate curated PBR texture PNGs for soft-goods materials.
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

function paintColor(base) {
  return (x, y) => {
    const noise = ((x * 37 + y * 17) % 9) - 4;
    return [base[0] + noise, base[1] + noise, base[2] + noise];
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
mkdirSync(join(texturesDir, "metal"), { recursive: true });

writeRgb(join(texturesDir, "wood/oak-color.png"), woodColor([185, 138, 88], -22));
writeRgb(join(texturesDir, "wood/oak-normal.png"), woodNormal());
writeRgb(join(texturesDir, "wood/oak-rough.png"), woodRough());
writeRgb(join(texturesDir, "wood/walnut-color.png"), woodColor([90, 57, 40], -18));
writeRgb(join(texturesDir, "wood/walnut-normal.png"), woodNormal());
writeRgb(join(texturesDir, "fabric/oatmeal-color.png"), fabricColor([200, 186, 166], 10));
writeRgb(join(texturesDir, "fabric/olive-color.png"), fabricColor([115, 118, 90], 9));
writeRgb(join(texturesDir, "fabric/rug-wool-color.png"), fabricColor([184, 166, 141], 12));
writeRgb(join(texturesDir, "paint/wall-color.png"), paintColor([233, 227, 216]));
writeRgb(join(texturesDir, "metal/charcoal-ao.png"), metalAo());

console.log(`Wrote curated PBR textures to ${texturesDir}`);
