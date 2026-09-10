# Animated homepage showroom

The Calm and Compact homepages share an isolated, illustrative cabinet scene.
It assembles a carcass, shelves, fronts, drawer, handles and countertop, then
reveals warm lighting. Visitors can replay, rotate with pointer or buttons,
open/close the drawer, and switch coordinated palettes:

- Midnight & walnut
- Gallery white
- Forest & oak

Palette selection persists under `cabinet-studio-showroom-palette`; invalid or
unavailable storage falls back to Midnight. It does not change editor materials,
projects, dimensions, approval states or production outputs.

## Loading and accessibility

The scene module and Three.js load separately, after the showroom is visible for
one second. A small existing kitchen-plan image appears first. Reduced-motion
and Save-Data/2G visitors opt in with the button; reduced motion shows the final
assembly without motion. WebGL failure keeps the fallback and offers retry.
Color choice, rotation, replay and drawer controls are keyboard-accessible.

The renderer runs only during assembly, drawer animation or an interaction. It
pauses offscreen and when the document is hidden. Route/theme unmount disposes
geometry, materials, observers, animation callbacks and the WebGL context.
Resolution is capped at 1.5 device pixel ratio with a 512px shadow map. No new
runtime dependency was added.

The designer route is lazy-loaded. Shared Vite loader helpers have their own
chunk so the homepage does not eagerly fetch the PDF/export chunk.

## Verification — September 10, 2026

- Production build passed (the existing editor chunk-size warning remains).
- 952 tests passed, including preference validation, assembly timing, idle-frame
  termination, hidden-document pause/resume and renderer disposal checks.
- Initial HTML-referenced JS/CSS: 90,490 gzip bytes in the measured build.
  The separate scene module is approximately 2.43 KB gzipped plus approximately
  189.58 KB for Three.js. These are build sizes, not measured network latency or
  a Core Web Vitals claim. Images/fonts are additional.
- Existing cutlist, machine preview, shortcuts and contextual-command fixtures
  match exactly. Canonical project baseline differs only in six generated sheet
  revision dates (September 9 → September 10); no baseline was overwritten.
- Local HTTP preview responded successfully. Browser/GPU visual acceptance is
  still needed on target devices; unit tests mock the WebGL renderer.

No public deployment was performed. Existing authentication, homepage sections
and designer workflows remain in place.
