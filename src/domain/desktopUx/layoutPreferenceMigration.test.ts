import { describe, expect, it } from "vitest";
import {
  INTERIORS_UI_MODE_STORAGE_KEY,
  MARKETING_THEME_STORAGE_KEY,
  migrateRetiredLayoutPreferences,
  migrateStoredLayoutPreference,
} from "./layoutPreferenceMigration";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => { data[key] = value; },
  };
}

describe("migrateStoredLayoutPreference", () => {
  it("rewrites a stored retired layout value to calm", () => {
    const storage = memoryStorage({ [INTERIORS_UI_MODE_STORAGE_KEY]: "compact" });
    expect(migrateStoredLayoutPreference(INTERIORS_UI_MODE_STORAGE_KEY, storage)).toBe("calm");
    expect(storage.data[INTERIORS_UI_MODE_STORAGE_KEY]).toBe("calm");
  });

  it("leaves other values and missing keys untouched", () => {
    const storage = memoryStorage({ other: "compact" });
    expect(migrateStoredLayoutPreference(INTERIORS_UI_MODE_STORAGE_KEY, storage)).toBe("calm");
    expect(storage.data).toEqual({ other: "compact" });
  });

  it("migrates both the editor and website keys at boot", () => {
    const storage = memoryStorage({
      [INTERIORS_UI_MODE_STORAGE_KEY]: "compact",
      [MARKETING_THEME_STORAGE_KEY]: "compact",
    });
    migrateRetiredLayoutPreferences(storage);
    expect(storage.data[INTERIORS_UI_MODE_STORAGE_KEY]).toBe("calm");
    expect(storage.data[MARKETING_THEME_STORAGE_KEY]).toBe("calm");
  });

  it("tolerates storage that throws", () => {
    const storage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => undefined,
    };
    expect(migrateStoredLayoutPreference("any", storage)).toBe("calm");
  });
});
