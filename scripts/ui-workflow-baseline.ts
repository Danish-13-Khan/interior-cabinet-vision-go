/** Step 1 preservation evidence. Run with node_modules/.bin/vite-node. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { defaultCabinetProject } from '../src/domain/cabinetDimensions';
import { listGoldenCabinetInstances } from '../src/domain/cabinetIdentity/goldenFixtures';
import { DEFAULT_ROOM } from '../src/domain/roomModel';
import { interiorProjectFromCabinetProject } from '../src/domain/interiorProject/cabinetAdapter';
import { serializeInteriorProjectFile, loadInteriorProjectFile } from '../src/domain/interiorProject/fileFormat';
import { prepareCutlistCsvExport, prepareMachineFileExport } from '../src/domain/productionFileExport';
import { DEFAULT_SHORTCUT_MAP } from '../src/domain/desktopUx/shortcutMap';
import { contextualRailCommands } from '../src/domain/livingRoom/contextualCommandRail';

const folder = path.resolve('docs/ui-workflow-step1/baseline');
const record = process.argv.includes('--record');
const now = '2026-09-09T00:00:00.000Z';
// Fix clock-derived defaults in the synthetic input, not in serialized output.
const project = JSON.parse(JSON.stringify(
  { ...defaultCabinetProject, cabinets: listGoldenCabinetInstances() },
  (key, value) => key === 'createdAt' || key === 'updatedAt' ? now
    : key === 'date' ? '9/9/2026' : value,
));
const document = interiorProjectFromCabinetProject({ project, activeRoom: DEFAULT_ROOM, now });
const saved = serializeInteriorProjectFile(document, now);
const loaded = loadInteriorProjectFile(saved);
const csv = prepareCutlistCsvExport(project);
const machine = prepareMachineFileExport(project, 'json-preview');
assert.equal(csv.ok, true, 'Golden cutlist must remain exportable');
assert.equal(machine.ok, true, 'Golden machine preview must remain exportable');
const reopenedCsv = prepareCutlistCsvExport(loaded.project);
const reopenedMachine = prepareMachineFileExport(loaded.project, 'json-preview');
assert.deepEqual(reopenedCsv, csv, 'Cutlist changed after save/reopen');
function stableMachine(value: typeof machine) {
  assert.equal(value.ok, true);
  if (!value.ok) throw new Error(value.status);
  const payload = JSON.parse(value.contents);
  // Only generation time is excluded; preserve every manufacturing field.
  payload.generatedAt = now;
  return JSON.stringify(payload, null, 2);
}
assert.equal(stableMachine(reopenedMachine), stableMachine(machine), 'Machine output changed after save/reopen');
const files: Record<string, string> = {
  'project.json': saved,
  'cutlist.csv': csv.ok ? csv.contents : '',
  'machine-preview.json': stableMachine(machine),
  'shortcuts.json': JSON.stringify(DEFAULT_SHORTCUT_MAP, null, 2),
  'contextual-commands.json': JSON.stringify(Object.fromEntries(
    (['none', 'wall', 'cabinet', 'panel', 'other'] as const).map(kind => [kind,
      Object.fromEntries((['plan', 'model', 'render'] as const).map(workspaceView =>
        [workspaceView, contextualRailCommands(kind, { workspaceView })]))])), null, 2),
};
if (record) fs.mkdirSync(folder, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  const file = path.join(folder, name);
  if (record) fs.writeFileSync(file, contents);
  else assert.equal(contents, fs.readFileSync(file, 'utf8'), `Baseline drift: ${name}; review, do not blindly rerecord`);
}
const manifest = Object.fromEntries(Object.entries(files).map(([name, contents]) =>
  [name, { bytes: Buffer.byteLength(contents), sha256: createHash('sha256').update(contents).digest('hex') }]));
if (record) fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
else assert.deepEqual(manifest, JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8')));
console.log(`${record ? 'Recorded' : 'Verified'} ${Object.keys(files).length} baselines; golden cabinet save/reopen preserves cutlist and machine preview.`);
