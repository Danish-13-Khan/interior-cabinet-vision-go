# Template card media roadmap (sharp stills and hover clips)

**Status:** Phases 0–3 done (2026-10-06); Phase 3 not yet committed.
Stills: `npm run media:cards`. Clips (96 frames → WebM + MP4):
`npm run media:cards:clips` or `npm run media:cards -- --with-clips`. All ten
clips pass their checks (largest 268 KB WebM). Phase 4 (`CardMedia` hover UI)
is next.
Branch: `feat/template-card-media`.
**Goal:** Every template card (four apartments and six catalog rooms) shows a
sharp, well-composed render. When the cursor rests on a card, a short clip of
the real 3D scene plays, rendered from the live app.
**Scope:** A deterministic capture hook in the app, a shared card-media
capture script (stills and clips), real renders for the six catalog rooms,
and one `CardMedia` component used by the marketing site and the app project
home.
**Relationship to other docs:** Reuses the stills pipeline and tour cameras
from [`APARTMENT_TEMPLATES_ROADMAP.md`](APARTMENT_TEMPLATES_ROADMAP.md)
(Phases 7 and 8.5). Card look follows
[`UI_CALM_LIGHT_ROADMAP.md`](UI_CALM_LIGHT_ROADMAP.md).

---

## 1. Evidence (verified in code, 2026-10-06)

- **Apartment stills are small and loosely framed.**
  `scripts/showcase-tour/render-apartment-stills.mjs` screenshots the live
  canvas at the tour's stop-1 pose and centre-crops to 800x600 WebP
  (47–77 KB). Cards display them at 640x480 on the site and 160x120 in the
  app, so on a 2x screen the site card is upscaled. The 2 BHK hero shows the
  TV overlapping a tall unit and doors filling half the frame. The camera is
  a tour pose, not composed as a thumbnail.
- **Catalog room thumbnails are not renders.** The six
  `public/catalog/templates/*-v1.png` files (2–3 KB) are flat plan diagrams
  drawn pixel by pixel by `scripts/catalog/lib/templateThumbnailPng.mjs`.
- **Hover is CSS only.** `src/marketing/styles/cards.css:25-34` and
  `src/styles/interiors-popular-templates.css:92-112` cross-fade to the plan
  still on hover and focus. Catalog cards just lift. There is no video asset
  or `<video>` element anywhere.
- **No ffmpeg on the dev machine.** Only `@napi-rs/canvas` is available for
  image encoding.
- **A live canvas per card is too heavy.** Every surface creates its own
  `<Canvas>`, and there is no drei `<View>`. One 3 BHK overview costs
  697 ms cold and 261 ms warm on an M5 production build (§8.4 of the
  apartment roadmap). The landing page deliberately ships no three.js. Ten
  cards would also approach the browser's WebGL context limit.

## 2. Decisions

- **D1 — Clips are rendered ahead of time from the live app, not run live.**
  The capture script drives the real scene frame by frame and encodes a
  video. The landing page stays free of three.js, hover starts within one
  frame, and phones get the same result as desktops. (Q1: confirmed.)
- **D2 — Deterministic frames, not screen recording.** Playwright's
  `recordVideo` runs in real time and drops frames during shader compiles.
  Instead, a capture hook sets the camera at time `t`, waits for
  `frameSettled`, and reads the canvas. Each frame is exact and repeatable.
- **D3 — Encoding uses `ffmpeg-static` as a devDependency.** It is used at
  build time only and never shipped. Outputs are H.264 MP4 (plays
  everywhere) plus VP9 WebM (smaller, listed first in `<source>`).
- **D4 — Stills are 1600x1200 masters with 800 and 1600 WebP variants**,
  served with `srcset`. The app's 160x120 card uses the 800 variant.
- **D5 — The apartment clip replaces the plan cross-fade on hover.** The
  clip starts on the whole-plan overview and glides into the hero room, so
  the plan is still shown. With reduced motion, the card keeps today's
  plan cross-fade and never loads video.
- **D6 — One component, two surfaces.** `CardMedia` (poster, optional plan
  still, optional clip) lives in a shared module with no three.js imports,
  and both `TemplatesSection.tsx` and the app pickers use it.
- **D7 — Versioned filenames.** Media files move to `-v2` names, so cached
  `-v1` files never show next to new cards.
- **D8 — Evening look everywhere (Q2).** Posters, plan stills and clips all
  use Presentation quality with the `evening` mood, so the light fixtures and
  wall lighting show.
- **D9 — Clips on both surfaces (Q3).** The website cards and the app's
  apartment and catalog cards all play clips. The app card shows the same
  800x600 file scaled down; there is no separate small encode.
- **D10 — Clips are 4 s (Q4):** 96 frames at 24 fps.

## 3. Contracts (lock before implementation)

### 3.1 Capture hook

Available only when the URL has `?capture=1` and only in dev or preview
builds; it is tree-shaken from production.

```ts
interface CardCaptureHook {
  /** Resolves once the scene is built, assets loaded, first frame settled. */
  ready(): Promise<void>;
  /** Camera paths available for the open project. */
  paths(): CardCameraPathId[]; // 'hero' | 'overview' | 'overview-to-hero' | 'room-arc'
  /** Place the camera on a path at t in [0,1]; resolves after frameSettled. */
  pose(path: CardCameraPathId, t: number): Promise<void>;
  /** Fixed quality and mood for the whole capture. */
  setLook(look: { quality: 'presentation'; mood: 'day' | 'evening' }): Promise<void>;
}
declare global { interface Window { __cardCapture?: CardCaptureHook } }
```

- `overview-to-hero` eases from the overview stop to the hero stop using the
  same interpolation as the showcase tour (`useShowcaseTour`), so the clip
  matches what users see in the app.
- `room-arc` is a slow 24° arc around the room centre at eye height
  1500 mm, looking at the main cabinet run. It is used for the catalog rooms
  and as a fallback.
- Every frame of a capture uses the same exposure. There is no auto-exposure
  between frames.

### 3.2 Card media manifest

The capture script writes a generated, committed
`src/domain/templateCardMedia/cardMedia.generated.ts`:

```ts
interface CardMedia {
  poster: { w800: string; w1600: string };   // webp
  plan?: { w800: string; w1600: string };    // apartments only
  clip?: { webm: string; mp4: string; durationMs: number };
}
export const CARD_MEDIA: Record<TemplateCardId, CardMedia>;
```

Marketing and app cards read paths from here instead of from the
`apartmentStills.ts` helpers.

### 3.3 Budgets

| Asset | Size | Limit |
|---|---|---|
| Poster, 800 WebP | 800x600 | ≤ 90 KB |
| Poster, 1600 WebP | 1600x1200 | ≤ 220 KB |
| Clip, WebM VP9 | 800x600, 24 fps, 4 s (96 frames) | ≤ 600 KB |
| Clip, MP4 H.264 | same | ≤ 900 KB |
| Landing page bytes before any hover | — | no increase from clips |

## 4. Phases

### Phase 0 — Capture hook and camera paths

- `window.__cardCapture` behind `?capture=1` (§3.1), dev and preview only.
- `overview-to-hero` and `room-arc` path builders as pure functions in
  `src/domain/templateCardsCapture/cameraPaths.ts`, reusing tour stop poses.
- Composition pass on hero poses: a per-template override for the hero
  camera (position, target, fov), so a thumbnail can be framed better than
  the tour stop without changing the tour.

**Exit gate:**
- Calling `pose(path, t)` twice at the same `t` gives identical pixels.
- `?capture=1` and the hook are absent from the production bundle (checked
  with a grep of `dist/`).
- Single-room catalog templates expose `room-arc`; apartments expose all
  four paths.

### Phase 1 — Sharp apartment stills (v2)

- Generalise `render-apartment-stills.mjs` into
  `scripts/card-media/capture.mjs`, run as `npm run media:cards`.
- Render at 1600x1200, `deviceScaleFactor` 2 on a 800x600 canvas host,
  Presentation quality, `evening` mood (D8).
- Write 800 and 1600 WebP posters and plan stills, run the existing exposure
  check, and write the manifest (§3.2).
- Cards use `srcset`/`sizes`.

**Exit gate:**
- All eight apartment images within budget and pass the exposure check.
- Side-by-side review of v1 and v2 for each apartment: no clipped furniture
  or overlapping objects in the hero frame, and the hero room is readable at
  the 160x120 app size.
- No horizontal page scroll at 375 px.

### Phase 2 — Real renders for the six catalog rooms

- The capture script opens each room via `catalog-template-<id>` and shoots
  the `room-arc` midpoint as the poster.
- Retire the flat PNG diagrams from the cards. The catalog JSON
  `thumbnailId` points to the new `-v2.webp`.

**Exit gate:**
- Six posters within budget and pass the exposure check.
- The app's `InteriorsPopularTemplates` and the site's `TemplatesSection`
  both show renders, and the fallback tile still works when a file is
  missing.

### Phase 3 — Hover clips

- Add `ffmpeg-static` (devDependency).
- The capture script steps `t` over 96 frames (4 s at 24 fps, D10),
  writes PNG frames to a temp dir, and encodes WebM VP9 and MP4 H.264 (yuv420p,
  `+faststart`).
- Apartments use `overview-to-hero`, which holds 0.5 s on each end, with
  3 s of motion between. The timeline (`clipTimeline.ts`) owns the easing;
  the path moves across early and down late, so the camera is over the hero
  room before it drops below wall height and never passes through a wall.
  Frames with `t` in 0.3–0.7 are rendered in both the apartment and the room
  scene and dissolved, so the scene swap is not a cut.
- Rooms use `room-arc` as one sine cycle starting at the poster pose
  (t = 0.5): it slows into each turn, repeats no frame, and loops seamlessly.
- The 2 BHK clip is shot in daylight, like its plan still (walnut reads
  near-black at dusk).
- Nothing reaches `public/` until a clip passes exposure and size checks;
  frames and encodes live in a temp folder that is always removed.

**Exit gate:**
- Ten clips within budget (§3.3).
- No dropped or repeated frames: every clip has exactly 96 frames
  (`durationMs` = 4000).
- Sampled frames (first, middle, last) pass the exposure check.
- Clips play in Chrome, Safari and Firefox.

### Phase 4 — `CardMedia` component and hover behaviour

- A shared `CardMedia` renders the poster `<img>`, then mounts
  `<video muted playsinline loop preload="none">` only after the pointer has
  rested on the card for 150 ms or the card has keyboard focus.
- The video fades in on its `playing` event, so there is no black flash. On
  leave it pauses, fades out and resets to 0.
- Touch devices with no hover: the card nearest the viewport centre, at least
  60% visible, plays (IntersectionObserver), one at a time. Data saver
  (`navigator.connection.saveData`) disables clips.
- Reduced motion: no video; the plan cross-fade stays (D5).
- Apartment clips end on the hero view and start on the plan, so looping
  them cuts every 4 s. Proposed: play apartment clips once and hold the last
  frame (it matches the poster); room clips loop.
- Adopt it in `TemplatesSection.tsx` (website), and in
  `InteriorsApartmentTemplates.tsx` and `InteriorsPopularTemplates.tsx` (app,
  D9). Remove the duplicated cross-fade CSS.
- In the app, the clip must not start while a template is being opened, and
  the video unmounts once the card is clicked.

**Exit gate:**
- No clip bytes are requested on landing-page load (network panel).
- Hover to first moving frame ≤ 300 ms on a warm cache over a fast
  connection.
- Moving across several cards quickly leaves at most one video playing.
- Reduced motion and keyboard focus behave as specified on both the website
  and the app project home.
- Light and dark site themes both look right, and there is no layout shift
  when the video mounts (CLS 0 on the cards).

## 5. Out of scope

- Live WebGL previews on cards (Q1 chose pre-rendered).
- Catalog item thumbnails (`public/catalog/items/`).
- Hosting media on a CDN; files stay in `public/`.

## 6. Questions (answered 2026-10-06)

- **Q1 — Pre-rendered clip or live 3D?** Pre-rendered (D1).
- **Q2 — Day or evening look?** Evening (D8).
- **Q3 — Clips in the app too?** Yes, on the website and the app cards (D9).
- **Q4 — Clip length?** 4 s (D10).

## 7. Suggested order

Phase 0 → 1 → 2 → 3 → 4. Phases 1 and 2 already give visibly better cards
with no hover work, so they can ship as one PR. Phases 3 and 4 ship
together, because clips without the component do nothing.
