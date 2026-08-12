#!/usr/bin/env node
/**
 * Print canonical living-room render preset matrix (no Three / DOM).
 */
const PRESETS = [
  {
    id: "draft",
    renderMode: "preview",
    resolution: "1280x720",
    pixelRatio: 1,
    shadowMapSize: 512,
    environmentResolution: 64,
    textureDetail: "low",
    transparent: false,
  },
  {
    id: "standard",
    renderMode: "hero",
    resolution: "1920x1080",
    pixelRatio: 1.5,
    shadowMapSize: 1024,
    environmentResolution: 128,
    textureDetail: "high",
    transparent: true,
  },
  {
    id: "presentation",
    renderMode: "hero",
    resolution: "2560x1440",
    pixelRatio: 2,
    shadowMapSize: 2048,
    environmentResolution: 256,
    textureDetail: "high",
    transparent: true,
  },
  {
    id: "client-preview",
    renderMode: "hero",
    resolution: "1920x1080",
    pixelRatio: 1.75,
    shadowMapSize: 1536,
    environmentResolution: 256,
    textureDetail: "high",
    transparent: true,
  },
];

console.log("[render-presets] model-view default → draft (preview / fast)");
for (const preset of PRESETS) {
  console.log(
    `[render-presets] ${preset.id.padEnd(14)} mode=${preset.renderMode.padEnd(7)} ` +
      `${preset.resolution} dpr=${preset.pixelRatio} shadow=${preset.shadowMapSize} ` +
      `env=${preset.environmentResolution} tex=${preset.textureDetail} ` +
      `alpha=${preset.transparent ? "ok" : "off"}`,
  );
}
console.log(`[render-presets] ${PRESETS.length} presets listed`);
