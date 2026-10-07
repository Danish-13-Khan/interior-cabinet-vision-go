/**
 * Write a Cycles still bundle for a project or an apartment template.
 *
 *   npx vite-node scripts/cycles/export-bundle.ts -- --template 2bhk --out .cycles/2bhk
 *   npx vite-node scripts/cycles/export-bundle.ts -- --project path/to/project.json --out .cycles/job
 *
 * Options: --camera <id>  --width <px> --height <px>  --mood day|evening  --seed <n>
 *          --time-cap <seconds>  --samples <n>
 *
 * The bundle describes the authored scene (never the live viewport). Render it with
 * `node scripts/cycles/render-still.mjs <out>`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { instantiateApartmentTemplate } from "../../src/domain/apartmentTemplates";
import { loadInteriorProjectFile } from "../../src/domain/interiorProject";
import type { LightingMood } from "../../src/domain/livingRoom/lightingMood";
import { exportCyclesBundleForProject } from "../../src/rendering/stillEngine/cycles/exportCyclesBundle";

const TEMPLATE_IDS: Record<string, string> = {
  studio: "template:apartment:studio:v1",
  "1bhk": "template:apartment:1bhk:v1",
  "2bhk": "template:apartment:2bhk:v1",
  "3bhk": "template:apartment:3bhk:v1",
};

function readArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]!;
    if (!item.startsWith("--")) continue;
    args[item.slice(2)] = argv[index + 1] && !argv[index + 1]!.startsWith("--") ? argv[index + 1]! : "true";
  }
  return args;
}

const args = readArgs(process.argv.slice(2));
const out = resolve(args.out ?? ".cycles/job");
let project;
if (args.template) {
  const id = TEMPLATE_IDS[args.template] ?? args.template;
  project = instantiateApartmentTemplate(id);
} else if (args.project) {
  const loaded = loadInteriorProjectFile(JSON.parse(readFileSync(resolve(args.project), "utf8")));
  if (!loaded.document) throw new Error(`Could not read ${args.project}`);
  project = loaded.document;
} else {
  throw new Error("Pass --template <studio|1bhk|2bhk|3bhk> or --project <file.json>");
}

const bundle = exportCyclesBundleForProject(project, {
  cameraId: args.camera,
  widthPx: args.width ? Number(args.width) : undefined,
  heightPx: args.height ? Number(args.height) : undefined,
  mood: args.mood === "evening" || args.mood === "day" ? (args.mood as LightingMood) : undefined,
  seed: args.seed ? Number(args.seed) : undefined,
  timeCapSeconds: args["time-cap"] ? Number(args["time-cap"]) : undefined,
  samplesMax: args.samples ? Number(args.samples) : undefined,
});

mkdirSync(out, { recursive: true });
const path = join(out, "bundle.json");
writeFileSync(path, `${JSON.stringify(bundle, null, 2)}\n`);
const lightCount = bundle.fixtures.reduce((sum, fixture) => sum + fixture.lights.length, 0)
  + bundle.recipeLights.length + bundle.windowKeys.length;
console.log(`${path}`);
console.log(`  job ${bundle.job.jobId} · camera ${bundle.job.cameraId} · ${bundle.render.widthPx}×${bundle.render.heightPx}`);
console.log(`  nodes ${bundle.nodes.length} (${bundle.nodes.filter((node) => node.model).length} GLB) · materials ${bundle.materials.length} (${bundle.materials.filter((m) => m.scan).length} scanned)`);
console.log(`  fixtures ${bundle.fixtures.length} · lights ${lightCount} · hdri ${bundle.environment.hdriAssetKey ?? "none"} @ ${bundle.environment.hdriStrength.toFixed(2)}`);
for (const warning of bundle.warnings) console.log(`  warning: ${warning}`);
