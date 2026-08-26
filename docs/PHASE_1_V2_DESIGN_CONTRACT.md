# Phase 1 — V2 Design Contract

**Status:** Locked for implementation.  
**Scope:** Visual language, workflow shell, interaction states, and responsive
rules. Domain data and classic UI retirement are outside this phase.

## Product promise

Cabinet Studio makes a measured room easy to understand. The canvas is the
primary surface; controls appear only when they help the current task.

```text
Start a project → Build in 2D → Design + dimensions → Review + export
```

## Locked shell

| Area | Rule |
| --- | --- |
| Header | Product, project, undo/redo, 2D/3D, save, export only. |
| Workflow | Project, Build, Design, Render. |
| Canvas | Largest surface; 2D is the authoring source. |
| Inspector | Selection-specific; never a permanent settings dump. |
| Status bar | Grid, snap, unit, zoom, selection, validation. |

## Visual tokens

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#243029` | Primary text |
| Muted | `#68766c` | Secondary text |
| Canvas | `#f1f5f2` | Working area |
| Panel | `#ffffff` | Header, rail, inspector |
| Line | `#dce5de` | Borders and dividers |
| Accent | `#276b46` | Primary actions, active state |
| Accent soft | `#e9f3eb` | Hover/selected background |
| Danger | `#b42318` | Destructive actions only |

Use the tokens in `src/styles/planner-ui-v2-tokens.css`; do not introduce a
second V2 palette in components.

## Type, spacing, and surfaces

- UI type: Avenir Next, then Segoe UI, then system fallback.
- Small radius: 6 px for inputs/actions; medium radius: 9 px for panels.
- Base spacing rhythm: 4, 8, 12, and 16 px.
- Panels are opaque white with a one-pixel line; shadows are avoided except for
  transient overlays.
- Icons support labels; icons alone require an accessible name.

## Required states

| Element | States |
| --- | --- |
| Action | Default, hover, focus-visible, disabled, busy |
| Mode | Default, active |
| Input | Default, focus, invalid, disabled |
| Selection | Unselected, selected, multi-selected |
| Validation | Clear, warning, error |

Focus must remain keyboard-visible. Disabled actions must explain their
unavailability through a label or contextual hint.

## Responsive rules

| Width | Behavior |
| --- | --- |
| ≥ 961 px | Rail, canvas, inspector/review visible. |
| 701–960 px | Compact rail; canvas remains dominant. |
| ≤ 700 px | Header actions compress; nonessential rails become drawers in later phases. |

The wide desktop workflow is the authoring baseline. Small screens support
review and light edits without compromising the canvas.

## Definition of done

- V2 uses only the frozen token palette and spacing/radius scale.
- All four workflow modes are represented consistently.
- No screen introduces an unrelated dashboard or duplicate project state.
- The header, rails, inspector, status, and project home meet responsive rules.
- Any change to this contract requires an explicit product decision.

