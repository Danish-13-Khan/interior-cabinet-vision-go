# Cabinet Studio — Business & Product Scope

**Status:** Working product definition (Sep 2026). Not a marketplace. Not a release certification.  
**Audience:** Founders, product, engineering.  
**Rule:** We sell software subscriptions. Customers own design, rates, client relationships, and money collection.

**Scope line (locked):** Client and payment **record** management is in scope. End-client payment **collection and processing** are out of scope.

---

## 1. One-line pitch (plain language)

We make an app for people who design kitchens and rooms. They draw the design, enter their own prices for wood and fittings, and the app builds a cost list / quote for their customer. We charge them a monthly fee for the app. We do not sell furniture, and we do not take money from their clients.

---

## 2. Positioning

**Design and business software:** design kitchens/rooms, calculate costs, prepare quotes, and manage project records (clients, quote revisions, payment *records*, balances, reports).

**Earn through subscriptions** — not through job GMV or processing their client payments.

**Justify higher plan prices through value:** client/payment management (solo upgrade), then team oversight (company) — not for the ability to save a design.

---

## 3. What we are / are not

### We are
- A **design + costing SaaS** for interior designers, cabinet shops, and engineers.
- A tool to **create projects**, collaborate (multi-user / company), and **generate estimates, BOQ, and quote/invoice documents**.
- A system where **they set** material rates, fittings, **labour**, markup, discounts, and taxes; we compute quantities and totals from the design.
- A place to **save designs and project details** on every paid plan.
- A **ledger for payment records** they enter (partial / paid / overdue) — money stays in *their* bank accounts.

### We are not
| Out of scope | Why |
| --- | --- |
| Selling kitchens, ply, or fittings | That is Livspace / retail |
| Marketplace checkout | We are not the merchant |
| Payment gateway / collecting homeowner ₹ | Processing out of scope |
| Invoicing homeowners **as us** | Invoice PDF is **their** document, our export |
| Huge furniture / décor marketplace | Dilutes millwork focus (Product Book non-goal) |
| Claiming Floorplanner / RoomSketcher / Planner5D parity | UX reference only (STR-004) |

### Who pays us
**Subscription only** — Designer → Professional → Company.  
Their fees to homeowners stay between **them and their client**.

---

## 4. Value proposition

> Help designers and engineers **price what they design**, with **their rates**, keep project/client/payment **records**, and export documents — without us selling the job or processing payment.

---

## 5. Users & plans

**Locked ladder:** Designer → Professional → Company. Solo users can pay more for client and payment management **without** buying team features.

| | Designer | Professional | Company |
| --- | --- | --- | --- |
| Who | Solo starter | Solo / small shop wanting business tools | Studio / factory with team |
| Seats | 1 | 1 | Multiple (roles) |
| Price book | Personal | Personal | Shared org book (+ optional overrides) |
| Saving | Designs + project details | Same | Same |
| Issued-quote protection | Freeze + basic revisions | Same | Same |
| Client on project | Name, contact, link to project | Same | Same (shared) |
| Consolidated client history | — | Yes | Yes (shared) |
| Payment records / schedules | — | Yes | Yes |
| Outstanding / overdue reports | — | Yes | Yes |
| Approvals workflow | — | — | Yes |
| Payment ledger history (corrections etc.) | — | Full retention | Full retention |
| Richer audit views / reporting | — | Basic list | Premium (freeze, export, payment, approval filters/export) |
| Shared projects / permissions / owner dashboard | — | — | Yes |
| Exports | Quote / BOQ / invoice files | Same | Same + clearer audit |

**On every paid plan (Designer+):** save designs; freeze issued quotes; basic revisions (new revision when design/rates change; issued snapshot stays intact); **basic client** (name, contact, association with a project) so quoting stays useful.

**Professional (solo upgrade):** consolidated client history, payment schedules/records, outstanding/overdue, owner-style status reports — **no** seats / shared org. Full payment-ledger history is retained; UI is a basic trail.

**Company only:** seats, roles, shared projects/permissions, shared price books, approvals, owner dashboard, **richer audit views and reporting** (same retained history, more product surface).

**Suggested roles (company):** Owner · Designer · Engineer · Viewer.

**Charge more for business features** — not for the ability to save a design.

---

## 6. Commercial engine (how price is made)

### Pipeline
```text
Design (rooms, cabinets, materials)
    → quantities (cutlist / BOM / area lines)
    → Price Book (editable rates: materials, fittings, labour, …)
    → Workshop cost (board, waste, finish, edge, hardware, labour %)
    → Quote settings (finish premium, labour allowance, markup, discount, tax)
    → Live estimate → Freeze snapshot (issued quote protected)
    → Export PDF / CSV / Excel / JSON
    → (Professional+) record client payments against a commercial document (no gateway)
```

### Labour (yes — included)
- **Workshop labour field:** `% of (board + waste)` via costing preset (e.g. ~35–45%) — customer-controllable.
- **Labour allowance:** optional flat ₹ on costing and/or quote settings — customer-controllable.
- Site installation can stay in **exclusions** unless they add it as their own line/allowance.

### Materials (rates they can edit)
**Already in engine (thin catalog):** Plywood, MDF, HDHMR, Particle; finishes (matte/gloss/wood/laminate generic); thickness rates (12/16/18/25); backs often default **6 mm**.

**Shop list to grow toward:** blockboard, pine; laminate grades (HG / acrylic / matt / inner carcass); shutter vs carcass norms (e.g. 16 carcass / 18 shutter / 9 back) as **defaults they can change**.

### Protect issued quotes (every paid plan)
- Freeze preserves **original quantities and prices**.
- Later design or rate changes → **new revision** (prior issued revision stays frozen; live becomes stale until refrozen).
- Do not silently rewrite an issued quote.
- **Approvals** and **richer audit views/reporting** are Company. Payment correction history is retained on Professional+; Company sells better views of it.

### Document exports (in scope)
| Export | Use |
| --- | --- |
| PDF quote / BOQ / tax invoice template | Email or print to their client |
| CSV / Excel | Accounts, Tally, spreadsheets |
| JSON | Their integrations later |

**Rule:** Generate + download = yes. Process payment = no.  
Branding: **their** legal name, GSTIN, invoice number they control.

---

## 7. Client & payment records (in scope)

### Status flow
`quoted → accepted → invoiced` (user-driven). A frozen quote can later be marked accepted; **invoice** is a commercial document derived from an accepted (or explicitly chosen) frozen revision — typically an invoice-template export + status, not a separate payment rail.

### Current obligation (locked — no double obligation)
- Exactly **one** commercial document per project commercial thread is the **current obligation** (the active frozen quote revision, or the invoice that superseded it).
- Superseded quotes/revisions remain **historical** for audit and exports; they **do not** contribute to outstanding, overdue, or owner “open balance” totals.
- Reports that sum outstanding across projects must include **only current obligations**.

### Payment allocation (locked — count once)
- Every payment record allocates to **exactly one** commercial document: a **frozen quote revision** *or* an **invoice** that superseded it.
- When a quote is **revised**: prior payment records stay on the **old frozen revision** (or transfer only via an explicit user “reallocate” action that is itself audited). Totals must never double-count.
- When a quote becomes an **invoice**: payments already on that quote’s frozen revision **roll forward once** to the invoice (same ledger rows, new parent pointer) — still counted once. The quote ceases to be the current obligation.
- **Invariant:** `sum(allocations of payment P) = amount of P` and each ₹ appears in outstanding math **exactly once** (on the current obligation after roll-forward).

### Applying payments to instalments (when a schedule exists)
- Default application order: **earliest due date first** (FIFO by due date), then remaining amount to later instalments, then unscheduled remainder on the document.
- User may override allocation to specific instalment lines; override is audited.
- Example: document ₹100,000 with ₹20,000 due yesterday and ₹80,000 due next month; ₹20,000 received → overdue = ₹0 on the past line if fully covered; if nothing received → **overdue = ₹20,000**, outstanding = ₹100,000.

### Definitions
| Term | Definition |
| --- | --- |
| **Payment schedule** | User-defined expected instalments (amount + due date) against the **current** commercial document. Optional on Professional+. |
| **Due date** | Date on a schedule line or on the document; user-set. |
| **Received** | Sum of payment records with status `recorded` (not voided) allocated to the **current** obligation. |
| **Outstanding** | On the **current** obligation only: `max(0, document total − received)`. Superseded documents: not included. |
| **Overdue** | Sum of **unpaid balances on instalments whose due dates have passed** (after applying payments FIFO as above). If no schedule: overdue = outstanding only when a single document due date exists and is past; otherwise overdue = 0 until due dates exist. **Never** treat future instalments as overdue. |
| **Partial payment** | Any recorded amount that does not fully clear the target instalment or document. |
| **Refund / correction** | Do **not** silently edit history. Prefer a new ledger entry: `refund` (negative) or `correction` linked to the original; or `void` the original (requires reason + actor). Net received excludes voided rows. |

### Who can record or correct (and audit)
| Action | Designer | Professional | Company |
| --- | --- | --- | --- |
| Record payment | — | Account owner | Roles with `payments:write` (default Owner; optional Designer) |
| Void / correct / refund / reallocate | — | Account owner | Owner (or explicit `payments:correct`); always require reason |
| View outstanding / overdue | — | Yes | Per permission |
| View payment ledger history | — | Yes (basic trail) | Yes + richer filters/export/reporting |

**Retention (locked):** every payment create, correction, refund, void, and reallocation stores **full history** on Professional and Company (actor, timestamp, before/after or reason, document id + revision id, instalment ids if any).  
**Product surface:** Professional gets a basic chronological trail; Company can charge for **richer audit views and reporting** over the same retained data. Do not drop history on Professional.

Users may **not** (via us): collect card/UPI through our gateway; hold escrow or disburse to vendors.

---

## 8. Design scope (product)

### Core (millwork-first)
- 2D plan (draw, measure, underlay/PDF, runs, dims)
- 3D review / present (client chrome stripped of edit tools)
- Cabinets, runs, materials visualization
- Engineering packet / cutlist (feeds cost; Report Center)

### Same BOQ model can later include (optional packs)
| Category | Examples | Notes |
| --- | --- | --- |
| Millwork-adjacent | Louvers, wall panels, countertops | Natural extension |
| Area finishes | Paint, wallpaper, flooring | Usually ₹/m² lines |
| Fixtures | Tap, sink, mirror, jet shower | Interiors FF&E; not plumbing execution |
| Hardware | Hinges, channels, handles, legs | Already partially in cost engine |

---

## 9. Competitor positioning (concise)

| Tool | Pricing model | Relation to us |
| --- | --- | --- |
| Floorplanner / RoomSketcher | Credits / area; little shop costing | Visual reference only |
| Planner5D / HomeStyler | Furniture budget / soft BOM | Not workshop cutlist maths |
| IKEA planner | Retail SKU cart | Catalog-owned prices |
| Livspace Canvas | Module SKU BOQ + payments/PO **processing** | Commerce platform; we track **records** only |
| Cedreo-style builders | Drawing × **their** rate cards | Closest **business** pattern |
| **Us** | Design + editable price book + BOQ/quote export + payment **records** + SaaS sub | Trade tool, not marketplace |

---

## 10. System architecture (logical)

```text
Identity & SaaS billing (OUR subscription only)
    Auth · plans (Designer / Professional / Company) · seats · org
Workspace
    Projects · rooms · revisions · permissions · saved records
Design
    2D / 3D · cabinets · materials · underlay
Commercial (CUSTOMER-owned rates)
    Price book (incl. labour) · cost engine · freeze / basic revisions
    BOQ / quote / invoice file export
Client & payment records (ledger only; Professional+)
    Client history · statuses · payment entries (count-once)
    Current obligation only for outstanding / overdue · FIFO instalments
    Full ledger retention; Company: richer audit views · approvals · owner dashboard
Engineering (optional depth)
    Cutlist · hardware · manufacturing reports
```

**Invariant:** Quantities from design × PriceBook → money fields. We do not hardcode market retail as the source of truth.

---

## 11. Build order (locked)

Separate **account foundations** (needed early) from **company product features** (last).

1. **Account foundations** — auth, Designer/Professional/Company plan SKUs, SaaS billing for *us*, save on every paid plan. Company plan may exist as a SKU early; **team product features** still ship last.  
2. **Design and costing** — labour fields + editable rates.  
3. **Quotes and saved records** — freeze + **basic revisions on every paid plan**.  
4. **Payment tracking** — records / schedules / outstanding / overdue (Professional+; no gateway).  
5. **Company controls** — seats in use, shared projects/permissions, shared price books, approvals, owner dashboard, full audit.

---

## 12. Delivery roadmap (aligned to build order)

| Phase | Focus |
| --- | --- |
| **A0** | Account foundations: auth, plan SKUs (Designer / Professional / Company), our SaaS billing, save on all paid plans. Seats/roles **schema** only if needed for billing — not full team UX yet. |
| **A** | Design and costing: editable Price Book (boards, thickness, finishes, fittings, **labour**, markup/discount/tax) + defaults |
| **B** | Quotes: BOQ views, freeze + basic revisions (all paid plans), PDF + CSV (+ Excel/JSON); invoice template export |
| **C** | Professional+: consolidated client history + payment **records** (count-once, current-obligation-only, FIFO overdue) + schedules + basic ledger trail |
| **D** | Company controls: seats/roles UX, shared projects/permissions, shared price books, approvals, full audit, owner dashboard |
| **E** | Design UX polish (shared shell, 2D plan, Present) |
| **F** | Optional packs (louvers, area finishes, fixtures) + engineer depth |

---

## 13. Success metrics

- Paid subscriptions and upgrades (Designer → Professional → Company)  
- Quotes/BOQs frozen or exported per active seat  
- Price-book adoption (rates edited from defaults, including labour)  
- Payment records used (without us processing ₹)  
**Not:** GMV or payment volume through our rails  

---

## 14. Decisions log

1. Position as design **and** business software.  
2. Subscription ladder: **Designer → Professional → Company** (solo can buy client/payment tools without team features).  
3. Customers control materials, fittings, **labour**, markup, discounts, taxes.  
4. Saving included in every paid plan.  
5. **Issued-quote protection + basic revisions on every paid plan**; Designer gets basic client (name/contact/project link); consolidated history + payments = Professional+; approvals + richer audit views = Company.  
6. Track payments without handling money; **each payment counted exactly once**; **only the current obligation** enters outstanding; superseded quotes are historical.  
7. Outstanding / overdue / schedule / instalment FIFO / partial / refund-correction rules defined in §7; overdue = past-due unpaid instalments only.  
8. Build order separates early **account foundations** from late **company controls**; roadmap phases match.  
9. **Client and payment record management in scope; end-client payment collection/processing out of scope.**  
10. Millwork-first; fixtures/wallpaper/etc. as optional BOQ lines later.  
11. Export invoice/quote as files is good; we do not collect payment.

---

## 15. Open follow-ups

- Exact seat limits and Professional feature packaging in pricing page copy.  
- Expand material catalog toward Indian shop norms.  
- Invoice template legal fields (GST, etc.) — copy is theirs.  
- UI redesign / 2D Room reference remain separate delivery tracks.  
- Pricing page copy for Professional vs Company audit surfaces.

---

*End of scope. Update this file when a business rule changes; do not silently add payment processing or marketplace without an explicit decision.*
