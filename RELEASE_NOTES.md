# Release notes

## Unreleased — Calm Light

### Behaviour changes

- **Wall cabinets sit on the inner wall face.** Wall-attached cabinets used to
  clamp against the wall centreline with a rotated footprint, which left
  side-wall cabinets about 215 mm off the wall and back-wall cabinets about
  60 mm into it. They now use the room's wall thickness (Room settings) so the
  cabinet back meets the inner face. Existing projects are re-clamped when they
  are opened, so wall-attached cabinets in saved files move to the corrected
  position; floor cabinets are unchanged.

### Known issues

- Golden-run end fillers are rounded to the 50 mm Engineering grid and sit
  behind the cabinets, 1–19 mm into the wall face, instead of flush with the
  cabinet fronts.
