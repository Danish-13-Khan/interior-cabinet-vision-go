# Import plan roadmap

**Job:** salesperson drops a 2D floor plan into the canvas, traces walls by hand, then cabinets.  
**Not the job:** auto-build a 3D house from a picture via an extract API.

Status: `NOW` · `NEXT` · `LATER` · `OUT`

---

## Sales flow (keep this simple)

```text
Import PNG / JPG / PDF / DWG  →  Calibrate a known wall  →  Draw room / walls  →  Doors  →  Cabinets
```

No extract API. PNG/JPG/PDF become a tracing picture immediately. DWG/DXF still use the existing CAD preview dialog (layers, millimetres-per-unit), then the same underlay.

---

## NOW — tracing underlay

| Item | Why |
| --- | --- |
| Import image or PDF as an underlay | Picture on the plan, nothing generated, no `/extract` call |
| Import DWG/DXF as a tracing background | Keep the main CAD importer; do not treat CAD as unsupported |
| Fit the camera to the imported plan | House plans were cropped or lost in empty 2D space |
| Keep draw hints off the picture | “Draw a room” text was covering the floor plan |
| Calibrate with a known length | Scale is a human check, not a silent guess |
| Draw room / wall / door / window on top | Same tools as a blank job |

---

## NEXT — make tracing pleasant

| Item | Why |
| --- | --- |
| Opacity + lock stay easy to find | Sales must see walls they draw vs the picture |
| Calibrate prompt in plain language | “Click two ends of a 3200 mm wall” |
| One room at a time on a house plan | Trace the kitchen first; other rooms can wait |

---

## LATER — only if customers ask

| Item | Risk |
| --- | --- |
| Auto wall detect → review → Apply | High; do not skip human check; must not be the default import |
| Multi-floor / whole-house 3D from one file | Out of the cabinet-sales job |

---

## OUT

- Claiming Floorplanner / SketchUp / AutoCAD parity  
- API-first import as the default sales path  
- Generating a furnished house from a picture  

**North star line:** *Import a floor plan, check the sizes, draw the room, hang cabinets.*
