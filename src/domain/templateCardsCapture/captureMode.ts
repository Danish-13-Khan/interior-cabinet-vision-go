export const CARD_CAPTURE_SESSION_KEY = "card-capture-mode";

/** Dev card-media capture (`?capture=1`), kept across in-app navigation; `?capture=0` turns it off. */
export function isCardCaptureSession(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const flag = new URLSearchParams(window.location.search).get("capture");
  if (flag === "1") {
    window.sessionStorage.setItem(CARD_CAPTURE_SESSION_KEY, "1");
    return true;
  }
  if (flag === "0") {
    window.sessionStorage.removeItem(CARD_CAPTURE_SESSION_KEY);
    return false;
  }
  return window.sessionStorage.getItem(CARD_CAPTURE_SESSION_KEY) === "1";
}
