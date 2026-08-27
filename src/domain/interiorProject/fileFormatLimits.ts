/** Desktop project files are local documents, not an unbounded ingestion channel. */
export const MAX_INTERIOR_PROJECT_FILE_BYTES = 25 * 1024 * 1024;

export function assertInteriorProjectFileByteLimit(byteLength: number) {
  if (byteLength > MAX_INTERIOR_PROJECT_FILE_BYTES) {
    throw new Error("Project file exceeds the 25 MB v1 safety limit.");
  }
}
