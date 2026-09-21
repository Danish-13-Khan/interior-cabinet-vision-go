// Usage: node scripts/dwg/smoke.mjs /path/to/sample.dwg [preview URL]
// Run npm run build and npm run preview -- --port 1432 first.
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const sample = process.argv[2];
if (!sample) throw new Error('Provide a DWG sample path.');
const workerFile = readdirSync('dist/assets').find(name => name.startsWith('dwgImport.worker-'));
assert(workerFile, 'Build the application first.');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.argv[3] || 'http://127.0.0.1:1432/');
  async function parse(bytes) {
    return page.evaluate(({ workerFile, bytes }) => new Promise((resolve, reject) => {
      const worker = new Worker(`/assets/${workerFile}`);
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Worker timed out')); }, 60000);
      worker.onerror = event => { clearTimeout(timer); worker.terminate(); reject(new Error(event.message)); };
      worker.onmessage = event => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
      worker.postMessage(new Uint8Array(bytes).buffer);
    }), { workerFile, bytes: [...bytes] });
  }
  const result = await parse(readFileSync(sample));
  assert(result.preview?.rendered > 0, JSON.stringify(result));
  const invalid = await parse(new TextEncoder().encode('This is not a DWG drawing.'));
  assert.equal(typeof invalid.error, 'string');
  console.log(JSON.stringify({ sample, rendered: result.preview.rendered, layers: result.preview.layers.length,
    mmPerUnit: result.preview.mmPerUnit, omitted: result.preview.omitted, malformedFileError: invalid.error }, null, 2));
} finally { await browser.close(); }
