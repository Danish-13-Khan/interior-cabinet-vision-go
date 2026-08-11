# Living Room Visualizer Release Candidate

Release candidate date: August 12, 2026

## Verified Journey

The LR-08 acceptance contract covers one canonical path:

```text
Living Room Release Demo
  -> edit an object in the 2D plan
  -> compile the synchronized 3D scene
  -> capture render metadata and an HD browser frame
  -> save canonical project JSON
  -> reopen the project
  -> recover the same document from autosave
```

The reopened project must retain the same object data, compiled nodes, scene
fingerprint, and scene bounds. Scene compilation and render-result creation may
not mutate canonical project data.

## Stable Demo

Open **Interiors -> Open Release Demo** from the project home. The demo uses
stable IDs, a fixed schema timestamp, the Nordic Light visual preset, verified
furniture placement, three project cameras, and presentation-ready QHD render
settings. It is created by `createLivingRoomReleaseDemoProject`, which is also
the fixture used by the LR-08 release contract tests.

## Local Verification

```bash
npm ci
npx playwright install chromium
npm run release:check
npm run release:mac
```

`release:check` runs all Vitest suites, the TypeScript/Vite production build,
the browser Plan-to-Render acceptance test, and native Rust command tests.

The macOS artifacts are written to:

```text
src-tauri/target/release/bundle/macos/Interior Cabinet Designer.app
src-tauri/target/release/bundle/dmg/Interior Cabinet Designer_0.1.0_aarch64.dmg
```

Exact DMG architecture naming follows the machine used for the build.

## CI Packaging

Run the **Release Candidate** GitHub Actions workflow manually, or push a tag
matching `v*`. The workflow executes the complete web quality gate on Linux,
then builds and uploads the macOS `.app` and `.dmg` from a macOS runner.

## Distribution Note

Local and CI bundles are ad-hoc signed for structural bundle integrity and are
not notarized. They are suitable for internal testing. Public macOS
distribution still requires an Apple Developer ID certificate,
hardened-runtime signing, and Apple notarization.
