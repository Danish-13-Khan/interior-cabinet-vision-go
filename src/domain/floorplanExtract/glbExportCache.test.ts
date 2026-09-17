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
import { glbDraftA, glbDraftN, okGlbResponse } from "./glbExport.testHelpers";

const draftB = glbDraftN(3);

beforeEach(() => {
  clearFloorplanGlbCache();
  vi.restoreAllMocks();
});

afterEach(() => {
  clearFloorplanGlbCache();
});

describe("getFloorplanGlb cache", () => {
  it("dedupes concurrent fetches without creating an object URL", async () => {
    const fetchMock = vi.fn(async () => okGlbResponse());
    vi.stubGlobal("fetch", fetchMock);
    const createSpy = vi.spyOn(URL, "createObjectURL");
    const [a, b] = await Promise.all([
      getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" }),
      getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.blob).toBe(b.blob);
    expect(createSpy).not.toHaveBeenCalled();
    const c = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(c.blob).toBe(a.blob);
    expect(peekFloorplanGlb(a.fingerprint)?.blob).toBe(a.blob);
  });

  it("stores distinct entries per fingerprint", async () => {
    const fetchMock = vi.fn(async () => okGlbResponse());
    vi.stubGlobal("fetch", fetchMock);
    const a = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    const b = await getFloorplanGlb(draftB, { apiBase: "https://example.test" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it("releaseFloorplanGlb drops one entry when no URL leases", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okGlbResponse()));
    const a = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    releaseFloorplanGlb(a.fingerprint);
    expect(peekFloorplanGlb(a.fingerprint)).toBeNull();
  });

  it("aborted caller does not reject the shared inflight for others", async () => {
    let resolveFetch!: (v: Response) => void;
    const fetchPromise = new Promise<Response>((r) => { resolveFetch = r; });
    vi.stubGlobal("fetch", vi.fn(async () => fetchPromise));
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
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
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
    }));
    const pending = getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    clearFloorplanGlbCache();
    await expect(pending).rejects.toThrow();
    resolveFetch(okGlbResponse());
    await Promise.resolve();
    expect(floorplanGlbCacheSize()).toBe(0);
  });

  it("retries after a failed export", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "boom" }), {
        status: 500, headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(okGlbResponse([4, 5]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" })).rejects.toThrow();
    const ok = await getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(ok.blob.size).toBeGreaterThanOrEqual(4);
  });

  it("rejects invalid non-GLB success bodies and does not cache them", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response("<html>error</html>", { status: 200, headers: { "content-type": "text/html" } }),
    ));
    await expect(getFloorplanGlb(glbDraftA, { apiBase: "https://example.test" })).rejects.toThrow(/GLB/);
    expect(floorplanGlbCacheSize()).toBe(0);
  });

  it("evicts oldest unleased entries past the LRU limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okGlbResponse()));
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
    vi.stubGlobal("fetch", vi.fn(async () => okGlbResponse()));
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
