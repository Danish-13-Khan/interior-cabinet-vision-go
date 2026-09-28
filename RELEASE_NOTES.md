# Release notes

## Unreleased — Calm Light

### Behaviour changes

- **Wall cabinets sit on the inner wall face.** Wall-attached cabinets used to
  clamp against the wall centreline with a rotated footprint, which left
  side-wall cabinets about 215 mm off the wall and back-wall cabinets about
  60 mm into it. They now use the room's wall thickness (Room settings) so the
  cabinet back meets the inner face. Existing projects are re-clamped when they
  are opened, so wall-attached cabinets in saved files move to the corrected
  position.
- **Opened projects fit each room's real size.** Cabinets used to be fitted to
  a default 6000 × 4000 mm room on load; they are now fitted to the room they
  belong to. Floor cabinets can move too: in rooms larger than the default they
  are no longer pulled inside the old edges, and in smaller rooms any cabinet
  past the room edge is pulled inside when the project opens.

### Known issues

- Golden-run end fillers are rounded to the 50 mm Engineering grid and sit
  behind the cabinets, 1–19 mm into the wall face, instead of flush with the
  cabinet fronts.
