import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SAMPLES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../docs/studio-workspace-redesign/stage1-samples",
);

export function resetSamplesDir() {
  rmSync(SAMPLES_DIR, { recursive: true, force: true });
  mkdirSync(SAMPLES_DIR, { recursive: true });
}

export function writeText(name: string, body: string) {
  const text = body.endsWith("\n") ? body : `${body}\n`;
  writeFileSync(join(SAMPLES_DIR, name), text);
}

export function writeJson(name: string, value: unknown) {
  writeText(name, `${JSON.stringify(value, null, 2)}\n`);
}
