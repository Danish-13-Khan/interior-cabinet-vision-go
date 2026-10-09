export const POST_LOGIN_LANDING_KEY = "cabinetStudio.postLoginLanding";

type LandingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function sessionStore(): LandingStorage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * A fresh login/register must land on the Interiors project home, even when a
 * browser draft is restored on boot. A plain page reload keeps reopening the draft.
 */
export function markPostLoginLanding(storage: LandingStorage | null = sessionStore()) {
  storage?.setItem(POST_LOGIN_LANDING_KEY, "1");
}

export function readPostLoginLanding(storage: LandingStorage | null = sessionStore()): boolean {
  return storage?.getItem(POST_LOGIN_LANDING_KEY) === "1";
}

export function clearPostLoginLanding(storage: LandingStorage | null = sessionStore()) {
  storage?.removeItem(POST_LOGIN_LANDING_KEY);
}
