type WallEditorProps = {
  showBackWall: boolean;
  showLeftWall: boolean;
  showRightWall: boolean;
  onChange: (walls: { showBackWall: boolean; showLeftWall: boolean; showRightWall: boolean }) => void;
};

export function WallEditor({ showBackWall, showLeftWall, showRightWall, onChange }: WallEditorProps) {
  const walls = [
    { key: "showBackWall" as const, label: "Back Wall", value: showBackWall },
    { key: "showLeftWall" as const, label: "Left Wall", value: showLeftWall },
    { key: "showRightWall" as const, label: "Right Wall", value: showRightWall },
  ];

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Walls</h2>
      </div>
      <div className="wall-toggles">
        {walls.map((w) => (
          <label key={w.key} className={`wall-toggle ${w.value ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={w.value}
              onChange={(e) =>
                onChange({
                  showBackWall,
                  showLeftWall,
                  showRightWall,
                  [w.key]: e.target.checked,
                })
              }
            />
            {w.label}
          </label>
        ))}
      </div>
    </div>
  );
}
