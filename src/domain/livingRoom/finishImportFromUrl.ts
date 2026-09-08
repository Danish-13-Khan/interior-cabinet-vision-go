import { encodeFinishImageDataUrl, MAX_FINISH_BYTES } from "./importedFinish";
import {
  finishImageMimeLabel,
  isAllowedFinishImageMime,
  validateFinishDataUrl,
} from "./importedFinishValidate";
import {
  DEFAULT_FINISH_IMPORT_UV,
  type FinishImportDraft,
} from "./finishImportDraft";
import {
  fileNameFromFinishImageUrl,
  mimeFromContentType,
  normalizeFinishImageUrl,
  validateFinishImageUrl,
} from "./finishImportUrlValidate";

export type FinishFetch = typeof fetch;

function parseContentLength(header: string | null): number | null {
  if (!header) return null;
  const value = Number(header);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Read a response body, aborting as soon as it exceeds `maxBytes`. */
export async function readResponseBytesCapped(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const declared = parseContentLength(response.headers.get("content-length"));
  if (declared != null && declared > maxBytes) {
    throw new Error("Finish image is larger than 2 MB.");
  }
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength <= 0) throw new Error("Finish image file is empty.");
    if (buffer.byteLength > maxBytes) throw new Error("Finish image is larger than 2 MB.");
    return new Uint8Array(buffer);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error("Finish image is larger than 2 MB.");
    }
    chunks.push(value);
  }
  if (total <= 0) throw new Error("Finish image file is empty.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Fetch a direct image URL and copy bytes into a data URL (never hotlink the remote URL).
 * Inject `fetchImpl` in tests.
 */
export async function fetchFinishImageAsDataUrl(
  rawUrl: string,
  fetchImpl: FinishFetch = fetch,
): Promise<{ dataUrl: string; fileName: string }> {
  const invalid = validateFinishImageUrl(rawUrl);
  if (invalid) throw new Error(invalid);
  const url = normalizeFinishImageUrl(rawUrl);
  let response: Response;
  try {
    response = await fetchImpl(url, { redirect: "follow" });
  } catch {
    throw new Error("Could not reach that image (blocked by the site or network).");
  }
  if (!response.ok) {
    throw new Error(`Could not download that image (HTTP ${response.status}).`);
  }
  const mime = mimeFromContentType(response.headers.get("content-type"));
  if (!mime || !isAllowedFinishImageMime(mime)) {
    throw new Error(`Unsupported file type. Import ${finishImageMimeLabel()}.`);
  }
  const bytes = await readResponseBytesCapped(response, MAX_FINISH_BYTES);
  const dataUrl = encodeFinishImageDataUrl(bytes, mime);
  const dataInvalid = validateFinishDataUrl(dataUrl);
  if (dataInvalid) throw new Error(dataInvalid);
  return { dataUrl, fileName: fileNameFromFinishImageUrl(url) };
}

/** Stage a remote image for M4 preview — project owns the bytes after apply. */
export async function stageFinishImportUrl(
  rawUrl: string,
  fetchImpl: FinishFetch = fetch,
): Promise<FinishImportDraft> {
  const fetched = await fetchFinishImageAsDataUrl(rawUrl, fetchImpl);
  return {
    fileName: fetched.fileName,
    dataUrl: fetched.dataUrl,
    ...DEFAULT_FINISH_IMPORT_UV,
  };
}
