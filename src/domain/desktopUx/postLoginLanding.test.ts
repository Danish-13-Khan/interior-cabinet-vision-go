import { describe, expect, it } from "vitest";
import { clearPostLoginLanding, markPostLoginLanding, readPostLoginLanding } from "./postLoginLanding";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("post-login landing", () => {
  it("is off until a login marks it", () => {
    expect(readPostLoginLanding(memoryStorage())).toBe(false);
  });

  it("stays readable until cleared, so a single boot can honour it", () => {
    const storage = memoryStorage();
    markPostLoginLanding(storage);
    expect(readPostLoginLanding(storage)).toBe(true);
    expect(readPostLoginLanding(storage)).toBe(true);
    clearPostLoginLanding(storage);
    expect(readPostLoginLanding(storage)).toBe(false);
  });

  it("tolerates a missing storage", () => {
    expect(() => markPostLoginLanding(null)).not.toThrow();
    expect(readPostLoginLanding(null)).toBe(false);
  });
});
