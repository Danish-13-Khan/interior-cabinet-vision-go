const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

export type DwgPathCommand =
  | { type: "M" | "L" | "A"; x: number; y: number }
  | { type: "Z" };

/** Commands from our DWG SVG paths (M/L/A/Z). Does not expand blocks. */
export function parseDwgPathCommands(d: string): DwgPathCommand[] {
  const commands: DwgPathCommand[] = [];
  const parts = d.match(/[MLAZ][^MLAZ]*/g) ?? [];
  for (const part of parts) {
    const type = part[0] as DwgPathCommand["type"];
    if (type === "Z") {
      commands.push({ type: "Z" });
      continue;
    }
    const nums = part.slice(1).match(NUM)?.map(Number) ?? [];
    if (type === "A") {
      const x = nums[nums.length - 2];
      const y = nums[nums.length - 1];
      if (nums.length < 7 || !Number.isFinite(x) || !Number.isFinite(y)) continue;
      commands.push({ type: "A", x, y });
      continue;
    }
    const x = nums[0];
    const y = nums[1];
    if (nums.length < 2 || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    commands.push({ type, x, y });
  }
  return commands;
}
