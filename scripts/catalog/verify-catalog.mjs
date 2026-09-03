/**
 * Regenerate Kenney catalog to a temp path and fail when it drifts from the
 * committed public/catalog/builtin-catalog.v1.json. Also rechecks file hashes.
 * Run: node scripts/catalog/verify-catalog.mjs
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashFile } from "./lib/fileHash.mjs";
import { generateKenneyManifest } from "./generate-kenney-manifest.mjs";
import { inspectGlb } from "./inspect-glb.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const committedPath = join(root, "public/catalog/builtin-catalog.v1.json");

function fail(message) {
  console.error(`[catalog:verify] ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (!existsSync(committedPath)) {
    fail(`missing committed manifest at ${committedPath}`);
    return;
  }
  const committed = JSON.parse(readFileSync(committedPath, "utf8"));
  const generated = await generateKenneyManifest();
  const tempDir = mkdtempSync(join(tmpdir(), "catalog-verify-"));
  const tempPath = join(tempDir, "builtin-catalog.v1.json");
  try {
    writeFileSync(tempPath, `${JSON.stringify(generated, null, 2)}\n`);
    const a = readFileSync(committedPath, "utf8");
    const b = readFileSync(tempPath, "utf8");
    if (a !== b) {
      fail("committed manifest differs from regenerated output; run catalog:generate");
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  if (committed.items?.length !== 140) {
    fail(`expected 140 items, found ${committed.items?.length}`);
  }

  for (const file of committed.files ?? []) {
    const abs = join(root, "public", file.objectKey);
    if (!existsSync(abs)) {
      fail(`missing file ${file.objectKey}`);
      continue;
    }
    const { byteSize, contentHash } = hashFile(abs);
    if (byteSize !== file.byteSize || contentHash !== file.contentHash) {
      fail(`hash/size mismatch for ${file.id}`);
    }
    if (file.kind === "model") {
      const inspection = await inspectGlb(abs);
      if (file.primitiveCount < 1 || inspection.primitiveCount < 1) {
        fail(`no renderable primitives for ${file.id}`);
      }
      if (inspection.primitiveCount !== file.primitiveCount) {
        fail(`primitive drift for ${file.id}`);
      }
      if (inspection.warnings.some((warning) => warning.startsWith("parse-failed"))) {
        fail(`GLB parse failed for ${file.id}`);
      }
    }
  }

  if (!process.exitCode) {
    console.log(
      `[catalog:verify] ok — ${committed.items.length} items, ${committed.files.length} files`,
    );
  }
}

await main();
