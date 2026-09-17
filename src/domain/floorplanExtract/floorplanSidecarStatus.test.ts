import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  clearFloorplanSidecarStatusCache,
  fetchFloorplanSidecarStatus,
  peekFloorplanSidecarStatus,
  peekFloorplanSidecarVersion,
} from "./floorplanSidecarStatus";
import { fingerprintFloorplanGlbRequest } from "./glbExportFingerprint";
import { glbDraftA } from "./glbExport.testHelpers";

describe("floorplanSidecarStatus", () => {
  beforeEach(() => {
    clearFloorplanSidecarStatusCache();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    clearFloorplanSidecarStatusCache();
    vi.restoreAllMocks();
  });

  it("caches version from /readyz and changes fingerprint when present", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, version: "0.5.0", service: "cabinet-floorplan" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));
    const status = await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" });
    expect(status.ok).toBe(true);
    expect(status.version).toBe("0.5.0");
    expect(peekFloorplanSidecarVersion()).toBe("0.5.0");

    const without = fingerprintFloorplanGlbRequest({
      draft: glbDraftA, apiBase: "http://sidecar.test",
    });
    const withV = fingerprintFloorplanGlbRequest({
      draft: glbDraftA, apiBase: "http://sidecar.test", sidecarVersion: "0.5.0",
    });
    expect(withV).not.toBe(without);
  });

  it("does not cache AbortError as a null version", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("Aborted", "AbortError");
    }));
    const status = await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" });
    expect(status.version).toBeNull();
    expect(peekFloorplanSidecarStatus()).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, version: "0.6.0" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));
    const next = await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" });
    expect(next.version).toBe("0.6.0");
    expect(peekFloorplanSidecarVersion()).toBe("0.6.0");
  });

  it("refreshes after TTL so sidecar upgrades are seen", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: "0.5.0" }), {
        status: 200, headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: "0.6.0" }), {
        status: 200, headers: { "content-type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" })).version).toBe("0.5.0");
    expect((await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" })).version).toBe("0.5.0");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61_000);
    expect((await fetchFloorplanSidecarStatus({ apiBase: "http://sidecar.test" })).version).toBe("0.6.0");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
