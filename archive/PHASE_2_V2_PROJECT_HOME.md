# Phase 2 — V2 Project Home

**Status:** Complete

## Delivered

- A V2-only project entry screen with the approved minimal copy and hierarchy.
- Project name entry with Enter-to-create support.
- **Create a room** creates a genuinely empty room shell.
- **Wardrobe wall** starts from cabinet-only content.
- **Import a plan** creates an empty, styled room ready for a PNG, JPG, or WebP
  tracing underlay in Build mode.
- Native Open Project, recent projects, and autosave recovery reuse existing
  project persistence commands.
- Returning to an open project never creates or mutates project data.

## Data contract

Each V2 starter remains an `InteriorProject`; no project-home UI state is saved
as authoring data. Template choice only defines the initial object collection:

| Template | Initial objects |
| --- | --- |
| Blank room | None |
| Wardrobe wall | Cabinet objects only |
| Import a plan | None; Nordic Light visual style |

## Acceptance path

1. Enable **New UI** and open Project Home.
2. Enter a project name.
3. Choose each starter option and confirm its expected initial content.
4. Save, reopen, and verify it appears in Recent Projects.
5. Return to a current project and confirm no data changes.

