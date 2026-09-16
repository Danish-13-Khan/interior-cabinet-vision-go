# QA guide — Cost of work (interiors estimate)

**Audience:** QA / testers  
**Where to test:** Live GitHub Pages — **https://Danish-13-Khan.github.io/interior-cabinet-vision-go/**  
**Do not** ask engineering for a local `npm run` setup unless Pages is down.  
**Related:** `docs/DUAL_DOCUMENT_RULE.md`, `docs/BUSINESS_PRODUCT_SCOPE.md`, `docs/SAAS_A_NOTES.md`

---

## What this covers

How a designer **generates interior cost of work** in the live app:

1. Enable the whole-interior estimate  
2. Enter **category rates** (and/or Price book interior rates)  
3. Review line costs, waste, and exclusions  
4. Optional: Finishes, Client, Payments/Company gates  
5. Freeze proposal (issued totals stay)  

**Out of scope:** full cabinet cutlist costing in Report Center (separate engine), Stripe/billing, Company admin beyond the entitlement gate.

---

## Setup (for QA)

1. Open Chrome or Safari.  
2. Go to: **https://Danish-13-Khan.github.io/interior-cabinet-vision-go/**  
3. Log in / register if the site asks (any test account is fine).  
4. Open or start a **Living Room** project so you see the plan workspace.  
5. Confirm **Project tools** appears in the top bar.

If the site is blank or an old build, tell engineering Pages may not have deployed latest `main` yet — still do **not** require their laptop.

---

## Pass / fail rules

| Result | Meaning |
| --- | --- |
| **Pass** | Expected UI + behaviour match |
| **Fail** | Wrong total, rates ignored, crash, or button missing |
| **Blocked** | Live site unreachable or cannot open Living Room |

Record: date/time, browser, URL, and a screenshot on fail.

---

## Test cases

### TC-01 — Open Project tools

**Steps:** Living Room → **Project tools**  
**Expect:** Tabs **Estimate · Finishes · Price book · Client · Payments · Company**  
**Pass:** All six tabs visible  

---

### TC-02 — Enable estimate

**Steps:** Estimate → tick **Include all rooms and interior items in the proposal**  
**Expect:** Status shows **Additional cost** and items that need a rate  
**Pass:** Checkbox sticks; status updates  

---

### TC-03 — Fill category rates

Enter a rate for every category. Examples:

| Category | Example rate |
| --- | --- |
| Ceiling finish · m² | 45 |
| Wall finish · m² | 80 |
| Floor finish · m² | 120 |
| Decor · each | 80 |
| Lighting · each | 150 |
| Electronics · each | 150 |
| Seating · each | 350 |
| Storage · each | 280 |
| Tables and desks · each | 200 |

**Expect:** “Need a rate” → toward **0**; **Additional cost** is a positive total; lines may say “From … rate”  
**Spot-check:** Floor line ≈ qty × rate (e.g. 21.84 × 120 ≈ **2,621**)  
**Pass:** Totals recalculate; no crash  

---

### TC-04 — Include / waste / override

Uncheck Include (total drops); Waste % = 10 (cost rises); higher line Rate overrides category.  
**Pass:** Totals move the right way  

---

### TC-05 — Price book

Set e.g. Wallpaper **80**, Tile **120**, LED driver **150**. Zero = unset.  
**Pass:** Values still there after close/reopen Project tools (same browser)  

---

### TC-06 — Finishes

Change a material finish or colour.  
**Pass:** No crash  

---

### TC-07 — Client

Enter name + phone (e.g. Priya Sharma, 9876543210).  
**Pass:** Fields accept input  

---

### TC-08 — Payments gate

**Expect:** Payments UI **or** clear “Professional / Company” message  
**Pass:** Not a blank broken panel  

---

### TC-09 — Company gate

**Expect:** Company UI **or** clear Company-plan message  
**Pass:** Message/UI is clear  

---

### TC-10 — Freeze after costing

Present (or Review) → **Freeze**  
**Pass:** Freeze succeeds; later live rate edits should not silently rewrite the frozen quote  

---

### TC-11 — Lights (optional)

**3D** → **Room lights** → add Pendant or Cove LED strip → set Kelvin (3000 or 4000).  
**Pass:** No crash  

---

## Happy path (~15–20 min)

1. Open live URL → Living Room → Project tools  
2. Enable estimate → fill category rates → screenshot total  
3. Price book sample rates  
4. Finishes + Client peek  
5. Payments + Company gates  
6. Freeze  

---

## Known OK (do not fail alone)

- Designer may only see Payments/Company upgrade messages  
- Cabinet manufacturing cost also in Report Center → Costing  
- Grand totals vary by room — check line math, not one fixed rupee total  

---

## Bug report

```text
Test number:
Date / URL:
Browser:
Steps:
Expected:
Actual:
Screenshot:
```

*End of QA guide.*
