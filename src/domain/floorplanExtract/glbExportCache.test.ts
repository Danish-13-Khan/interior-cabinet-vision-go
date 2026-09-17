import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  FLOORPLAN_GLB_CACHE_LIMIT,
  acquireFloorplanGlbObjectUrl,
  clearFloorplanGlbCache,
  floorplanGlbCacheSize,
  getFloorplanGlb,
  peekFloorplanGlb,
  releaseFloorplanGlb,
  releaseFloorplanGlbObjectUrl,
} from "./glbExportCache";
import { glbDraftA, glbDraftN, okGlbResponse, readyOkResponse } from "./glbExport.testHelpers";
import { clearFloorplanSidecarStatusCache } from "./floorplanSidecarStatus";
import { clearFloorplanTelemetry, summarizeFloorplanTelemetry } from "./floorplanTelemetry";

const draftB = glbDraftN(3);

function mockFloorplanFetch(glbImpl?: () => Response | Promise<Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/readyz")) return readyOkResponse();
    return (glbImpl ?? (() => okGlbResponse()))();
  });
}

function exportCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter((c) => String(c[0]).includes("/export/glb")).length;
}

beforeEach(() => {
  clearFloorplanGlbCache();
  clearFloorplanSidecarStatusCache();
  clearFloorplanTelemetry();
  vi.restoreAllMocks();
});

afterEach(() => {
  clearFloorplanGlbCache();
  clearFloorplanSidecarStatusCache();
});

describe("getFloorplanGlb cache", () => {
  it("dedupes concurrent fetches without creating an object URL", async () => {
    const fetchMock = mockFloorplanFetch();
    vi.stubGlobal("fetch", fetchMock);
    const createSpy = vi.spyOn(URL, "createObjectURL");
    const [a, b] = await Promise.all([
      getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" }),
      getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" }),
    ]);
    expect(exportCalls(fetchMock)).toBe(1);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.blob).toBe(b.blob);
    expect(createSpy).not.toHaveBeenCalled();
    const c = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    expect(exportCalls(fetchMock)).toBe(1);
    expect(c.blob).toBe(a.blob);
    expect(peekFloorplanGlb(a.fingerprint)?.blob).toBe(a.blob);
    expect(summarizeFloorplanTelemetry().cacheMisses).toBe(1);
    expect(summarizeFloorplanTelemetry().cacheHits).toBe(1);
  });

  it("stores distinct entries per fingerprint", async () => {
    const fetchMock = mockFloorplanFetch();
    vi.stubGlobal("fetch", fetchMock);
    const a = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    const b = await getFloorplanGlb(draftB, { apiBase: "https://example.test" });
    expect(exportCalls(fetchMock)).toBe(2);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it("releaseFloorplanGlb drops one entry when no URL leases", async () => {
    vi.stubGlobal("fetch", mockFloorplanFetch());
    const a = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    releaseFloorplanGlb(a.fingerprint);
    expect(peekFloorplanGlb(a.fingerprint)).toBeNull();
  });

  it("aborted caller does not reject the shared inflight for others", async () => {
    let resolveFetch!: (v: Response) => void;
    const fetchPromise = new Promise<Response>((r) => { resolveFetch = r; });
    vi.stubGlobal("fetch", mockFloorplanFetch(() => fetchPromise));
    const ac = new AbortController();
    const p1 = getFloorplanGlb(glbDraftA, { apiBase: "https://example.test", signal: ac.signal });
    const p2 = getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    ac.abort();
    await expect(p1).rejects.toThrow();
    resolveFetch(okGlbResponse([9]));
    expect((await p2).blob.size).toBeGreaterThanOrEqual(4);
  });

  it("clear while in flight aborts and does not repopulate memory", async () => {
    let resolveFetch!: (v: Response) => void;
    const fetchPromise = new Promise<Response>((r) => { resolveFetch = r; });
    let exportStarted = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/readyz")) return readyOkResponse();
      exportStarted = true;
      const signal = init?.signal;
      return new Promise<Response>((resolve, reject) => {
        const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
        if (signal?.aborted) { onAbort(); return; }
        signal?.addEventListener("abort", onAbort, { once: true });
        fetchPromise.then((res) => {
          signal?.removeEventListener("abort", onAbort);
          resolve(res);
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const pending = getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    await vi.waitFor(() => expect(exportStarted).toBe(true));
    clearFloorplanGlbCache();
    await expect(pending).rejects.toThrow();
    resolveFetch(okGlbResponse());
    await Promise.resolve();
    expect(floorplanGlbCacheSize()).toBe(0);
  });

  it("retries after a failed export", async () => {
    let exportN = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/readyz")) return readyOkResponse();
      exportN += 1;
      if (exportN === 1) {
        return new Response(JSON.stringify({ error: "boom" }), {
          status: 500, headers: { "content-type": "application/json" },
        });
      }
      return okGlbResponse([4, 5]);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" })).rejects.toThrow();
    const ok = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    expect(exportN).toBe(2);
    expect(ok.blob.size).toBeGreaterThanOrEqual(4);
    expect(summarizeFloorplanTelemetry().exportErrors).toBe(1);
    expect(summarizeFloorplanTelemetry().cacheMisses).toBe(1);
  });

  it("rejects invalid non-GLB success bodies and does not cache them", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/readyz")) return readyOkResponse();
      return new Response("<html>error</html>", { status: 200, headers: { "content-type": "text/html" } });
    }));
    await expect(getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" })).rejects.toThrow(/GLB/);
    expect(floorplanGlbCacheSize()).toBe(0);
  });

  it("evicts oldest unleased entries past the LRU limit", async () => {
    vi.stubGlobal("fetch", mockFloorplanFetch());
    const fps: string[] = [];
    for (let i = 1; i <= FLOORPLAN_GLB_CACHE_LIMIT + 2; i++) {
      fps.push((await getFloorplanGlb(glbDraftN(i), { apiBase: "https://example.test" })).fingerprint);
    }
    expect(floorplanGlbCacheSize()).toBe(FLOORPLAN_GLB_CACHE_LIMIT);
    expect(peekFloorplanGlb(fps[0])).toBeNull();
    expect(peekFloorplanGlb(fps[1])).toBeNull();
    expect(peekFloorplanGlb(fps[fps.length - 1])).not.toBeNull();
  });

  it("object URLs are lazy, leased, and revoked at zero leases", async () => {
    vi.stubGlobal("fetch", mockFloorplanFetch());
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-1");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const a = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    expect(createSpy).not.toHaveBeenCalled();
    const u1 = acquireFloorplanGlbObjectUrl(a.fingerprint);
    const u2 = acquireFloorplanGlbObjectUrl(a.fingerprint);
    expect(u1).toBe(u2);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(() => releaseFloorplanGlb(a.fingerprint)).toThrow(/leases/);
    releaseFloorplanGlbObjectUrl(a.fingerprint);
    expect(revokeSpy).not.toHaveBeenCalled();
    releaseFloorplanGlbObjectUrl(a.fingerprint);
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock-1");
    releaseFloorplanGlb(a.fingerprint);
    expect(peekFloorplanGlb(a.fingerprint)).toBeNull();
  });
});
