export const ENGINEERING_SESSION_ROUTE_KEY = "cabinet-designer-engineering-session";

export function readEngineeringSessionRoute(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.sessionStorage
    : null,
): boolean {
  try {
    return storage?.getItem(ENGINEERING_SESSION_ROUTE_KEY) === "active";
  } catch {
    return false;
  }
}

export function writeEngineeringSessionRoute(
  active: boolean,
  storage: Pick<Storage, "setItem" | "removeItem"> | null = typeof window !== "undefined"
    ? window.sessionStorage
    : null,
) {
  try {
    if (active) storage?.setItem(ENGINEERING_SESSION_ROUTE_KEY, "active");
    else storage?.removeItem(ENGINEERING_SESSION_ROUTE_KEY);
  } catch {
    // Locked-down WebViews may reject session storage; live navigation still works.
  }
}
