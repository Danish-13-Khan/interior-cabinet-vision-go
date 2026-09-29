/** Warning for a saved/exported file whose imported model bytes could not be found in browser storage. */
export function missingStoredAssetsMessage(missing: readonly string[]): string | null {
  const count = new Set(missing).size;
  if (!count) return null;
  const files = count === 1 ? "1 imported model file is" : `${count} imported model files are`;
  return `${files} missing from this browser's storage; the saved file shows a placeholder for them. Re-import the model to fix.`;
}
