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
- **Floor cabinets stop at the inner wall face too.** A floor cabinet pushed
  against a wall used to clamp to the wall centreline and could sit up to half
  the wall thickness inside it; saved projects with such cabinets move out by
  up to that amount when opened.
- **Run end fillers sit flush with the cabinet fronts.** Fillers were placed
  against the wall behind the run (and Engineering's 50 mm grid pushed them
  into the wall face); new and regenerated fillers now close the gap at the
  front, and Engineering keeps them at millimetre precision when moving,
  rotating, resizing or duplicating. Fillers in project files and recovery
  snapshots slide forward to the cabinet fronts when opened (width, id and
  position along the wall are kept). Projects reopened from the in-app
  project list keep their old filler position until the run is edited.
- **Run fillers match the cabinet finish.** A filler with no finish of its own
  used to render in walnut; it now takes the run's front finish, and seeded
  fillers copy their cabinet's material slots.
