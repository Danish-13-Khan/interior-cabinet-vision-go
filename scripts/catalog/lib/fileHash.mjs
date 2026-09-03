import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

export function hashFile(absolutePath) {
  const bytes = readFileSync(absolutePath);
  const digest = createHash("sha256").update(bytes).digest("hex");
  return {
    byteSize: statSync(absolutePath).size,
    contentHash: `sha256:${digest}`,
  };
}
