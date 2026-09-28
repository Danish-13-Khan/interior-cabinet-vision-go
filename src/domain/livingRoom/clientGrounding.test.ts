import { describe, expect, it } from "vitest";
import { CLIENT_CONTACT_SHADOW_MAX_OPACITY, resolveContactShadowLook } from "./clientGrounding";

describe("resolveContactShadowLook", () => {
  const base = { opacity: 0.3, blur: 2.8 };

  it("leaves authoring views unchanged", () => {
    expect(resolveContactShadowLook(base, "author")).toEqual(base);
    expect(resolveContactShadowLook(base, undefined)).toEqual(base);
  });

  it("gives Present a darker, tighter contact shadow", () => {
    const client = resolveContactShadowLook(base, "client");
    expect(client.opacity).toBeGreaterThan(base.opacity);
    expect(client.blur).toBeLessThan(base.blur);
  });

  it("caps client opacity so shadows never turn into black pools", () => {
    expect(resolveContactShadowLook({ opacity: 0.9, blur: 2 }, "client").opacity).toBe(CLIENT_CONTACT_SHADOW_MAX_OPACITY);
  });
});
