type Props = { onChoose: () => void };

export function ImportWallsControls({ onChoose }: Props) {
  return (
    <section className="lr-room-authoring" data-testid="lr-import-walls">
      <strong>5. Import walls</strong>
      <small>DXF or SVG → review draft → Apply into the room (2D and 3D). PNG/PDF stay underlay only.</small>
      <button type="button" data-testid="lr-import-walls-choose" onClick={onChoose}>
        Choose DXF or SVG
      </button>
    </section>
  );
}
