# Import plan roadmap

**Job:** salesperson drops a 2D floor plan into the canvas, traces walls by hand, then cabinets.  
**Not the job:** auto-build a 3D house from AutoCAD.

Status: `NOW` · `NEXT` · `LATER` · `OUT`

---

## Sales flow (keep this simple)

```text
Import PNG / JPG / PDF  →  Calibrate a known wall  →  Draw room / walls  →  Doors  →  Cabinets
```

No extract API. No DXF/DWG in this path.

---

## NOW — tracing underlay

| Item | Why |
| --- | --- |
| Import image or PDF as an underlay | Picture on the plan, nothing generated |
| Fit the camera to the imported plan | House plans were cropped or lost in empty 2D space |
| Keep draw hints off the picture | “Draw a room” text was covering the floor plan |
| Calibrate with a known length | Scale is a human check, not a silent guess |
| Draw room / wall / door / window on top | Same tools as a blank job |

---

## NEXT — make tracing pleasant

Do these before any CAD or AI work.

| Item | Why |
| --- | --- |
| Fit / zoom remember the underlay | Fit button and first import should show the whole plan |
| Opacity + lock stay easy to find | Sales must see walls they draw vs the picture |
| Calibrate prompt in plain language | “Click two ends of a 3200 mm wall” |
| One room at a time on a house plan | Trace the kitchen first; other rooms can wait |
| Undo after import / calibrate / draw | People will mis-click scale |

---

## LATER — only if customers ask

| Item | Risk |
| --- | --- |
| DWG / DXF → still an underlay (or later, walls) | Licensing + messy files |
| Multi-page PDF already exists; polish crop | Low |
| Auto wall detect → review → Apply | High; do not skip human check |
| Multi-floor / whole-house 3D from one file | Out of the cabinet-sales job |

---

## OUT

- Claiming Floorplanner / SketchUp / AutoCAD parity  
- API-first import as the default sales path  
- Generating a furnished house from a picture  

---

## How to pick the next feature

1. Does it help **Import → Calibrate → Trace → Cabinet** in under 10 minutes?  
2. If no, it waits.  
3. If yes, ship the smallest slice on `fix/import-plan-underlay-only` / a follow-up `feat/import-plan-*` branch.

**North star line:** *Import a floor plan, check the sizes, draw the room, hang cabinets.*
