import { describe, expect, it, vi } from "vitest";
import {
  createEmptyInteriorProject,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  commitFinishImportDraft,
  finishMapUrl,
  MAX_FINISH_BYTES,
  readResponseBytesCapped,
  stageFinishImportUrl,
  validateFinishImageUrl,
} from "./index";

const TINY_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
  (char) => char.charCodeAt(0),
);

function mockFetch(bytes: Uint8Array, contentType: string, status = 200): typeof fetch {
  return vi.fn(async () => new Response(bytes, {
    status,
    headers: { "content-type": contentType },
  })) as unknown as typeof fetch;
}

describe("finish import from URL (M6.2)", () => {
  it("rejects non-http URLs", () => {
    expect(validateFinishImageUrl("")).toMatch(/Paste a direct image URL/);
    expect(validateFinishImageUrl("javascript:alert(1)")).toMatch(/http/);
    expect(validateFinishImageUrl("not a url")).toMatch(/valid URL/);
  });

  it("copies remote image bytes into a staged data-URL draft", async () => {
    const draft = await stageFinishImportUrl(
      "https://cdn.example.com/oak.png",
      mockFetch(TINY_PNG, "image/png"),
    );
    expect(draft.fileName).toBe("oak.png");
    expect(draft.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(draft.dataUrl.includes("https://")).toBe(false);
  });

  it("rejects unsupported MIME and oversized payloads", async () => {
    await expect(stageFinishImportUrl(
      "https://cdn.example.com/x.gif",
      mockFetch(TINY_PNG, "image/gif"),
    )).rejects.toThrow(/Unsupported file type/);

    const huge = new Uint8Array(MAX_FINISH_BYTES + 1);
    await expect(stageFinishImportUrl(
      "https://cdn.example.com/huge.png",
      mockFetch(huge, "image/png"),
    )).rejects.toThrow(/2 MB/);
  });

  it("rejects oversized payloads via Content-Length before reading the body", async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(MAX_FINISH_BYTES + 1),
      },
    })) as unknown as typeof fetch;
    await expect(stageFinishImportUrl("https://cdn.example.com/huge.png", fetchImpl))
      .rejects.toThrow(/2 MB/);
  });

  it("stops streaming once the body exceeds the per-texture cap", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024));
        controller.enqueue(new Uint8Array(1024 * 1024));
        controller.enqueue(new Uint8Array(1));
        controller.close();
      },
    });
    const response = new Response(stream, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
    await expect(readResponseBytesCapped(response, MAX_FINISH_BYTES)).rejects.toThrow(/2 MB/);
  });

  it("persists copied bytes so reopen does not need the original host", async () => {
    const draft = await stageFinishImportUrl(
      "https://cdn.example.com/tile.webp",
      mockFetch(TINY_PNG, "image/webp"),
    );
    const project = createEmptyInteriorProject({ id: "url-finish", now: "2026-09-07T00:00:00.000Z" });
    const committed = commitFinishImportDraft(project, draft, { floor: true });
    const material = committed.materials.find((item) => item.id.startsWith("finish-import-"))!;
    expect(finishMapUrl(material)?.startsWith("data:image/webp")).toBe(true);

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(committed)).document;
    const again = reopened.materials.find((item) => item.id === material.id)!;
    expect(finishMapUrl(again)?.startsWith("data:image/")).toBe(true);
    expect(finishMapUrl(again)?.includes("cdn.example.com")).toBe(false);
  });

  it("surfaces network failures clearly", async () => {
    const failing = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await expect(stageFinishImportUrl("https://cdn.example.com/oak.png", failing))
      .rejects.toThrow(/blocked by the site or network/);
  });
});
