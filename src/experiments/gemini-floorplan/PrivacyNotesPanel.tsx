import { shouldUseGeminiProxy } from "./labFlags";

export function PrivacyNotesPanel() {
  const proxy = shouldUseGeminiProxy();
  return (
    <section className="gfl-panel gfl-privacy" aria-label="Privacy and local mode">
      <header className="gfl-panel__head">
        <h2>Privacy</h2>
        <p>Phase 5 — local-only lab defaults. See experiments/gemini-floorplan/PRIVACY.md.</p>
      </header>
      <ul className="gfl-privacy__list">
        <li>Images are downscaled (max 1600px) and re-encoded to JPEG before Vision (EXIF stripped).</li>
        <li>
          {proxy
            ? "Vision calls go through the local Vite proxy — the API key stays on the server (.env)."
            : "Direct browser key mode is on (VITE_GEMINI_USE_PROXY=false). Prefer proxy for demos."}
        </li>
        <li>Do not upload customer plans to shared/public hosts without a privacy review.</li>
        <li>Offline fixtures never leave your machine.</li>
      </ul>
    </section>
  );
}
